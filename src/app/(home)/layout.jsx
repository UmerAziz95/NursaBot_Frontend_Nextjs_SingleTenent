import Header from "@/layout/Header";
import Footer from "@/layout/Footer";

export default function HomeLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

