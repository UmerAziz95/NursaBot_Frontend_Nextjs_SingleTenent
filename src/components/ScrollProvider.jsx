"use client";

import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { initScrollAnimations } from "@/utils/gsapScrollAnimations";

export default function ScrollProvider({ children }) {
    const pathname = usePathname();
    const lenisRef = useRef(null);
    const rafIdRef = useRef(null);
    const [isMounted, setIsMounted] = useState(false);

    // Wait for client-side hydration to complete
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // Only initialize on client side after hydration
        if (typeof window === 'undefined' || !isMounted) return;

        gsap.registerPlugin(ScrollTrigger);

        const lenis = new Lenis({
            lerp: 0.08,
            smooth: true,
            wheelMultiplier: 1,
        });

        lenisRef.current = lenis;
        window.lenis = lenis;

        lenis.on("scroll", ScrollTrigger.update);

        function raf(time) {
            lenis.raf(time);
            rafIdRef.current = requestAnimationFrame(raf);
        }

        rafIdRef.current = requestAnimationFrame(raf);

        // Wait for React hydration to complete before initializing GSAP animations
        // Use a longer delay and check document ready state to ensure React has fully hydrated
        const initAnimations = () => {
            // Double check that document is ready and React has hydrated
            if (document.readyState === 'complete' && document.body) {
                // Additional small delay to ensure all React effects have run
                setTimeout(() => {
                    initScrollAnimations();
                }, 100);
            } else {
                // If not ready, wait for load event
                window.addEventListener('load', () => {
                    setTimeout(() => {
                        initScrollAnimations();
                    }, 100);
                }, { once: true });
            }
        };

        const initTimer = setTimeout(initAnimations, 300);

        return () => {
            clearTimeout(initTimer);
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
            lenis.destroy();
            ScrollTrigger.getAll().forEach((t) => t.kill());
        };
    }, [isMounted]);

    // This runs every time the route changes
    useEffect(() => {
        if (typeof window === 'undefined' || !isMounted) return;
        
        requestAnimationFrame(() => {
            const lenis = lenisRef.current || window.lenis;
            if (lenis) {
                lenis.scrollTo(0, { immediate: true });
            }

            ScrollTrigger.clearScrollMemory();
            ScrollTrigger.refresh(true);
            
            // Re-initialize animations after route change
            // Use a longer delay to ensure React has finished rendering
            const initTimer = setTimeout(() => {
                initScrollAnimations();
            }, 150);
        });
    }, [pathname, isMounted]);

    return <>{children}</>;
}
