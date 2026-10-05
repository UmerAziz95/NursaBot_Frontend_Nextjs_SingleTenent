'use client'

import Link from 'next/link'
import LegalPage from '@/sections/legal/LegalPage'

const sections = ({ siteName, contactLink }) => [
    {
        id: 'who-we-are',
        title: 'Who we are',
        body: (
            <p>
                {siteName} (&quot;we&quot;, &quot;us&quot;) provides an AI study assistant for nursing and healthcare students.
                This policy explains what personal information we collect when you use our website and app, how we use it,
                and the choices you have. You can contact us at any time via {contactLink}.
            </p>
        ),
    },
    {
        id: 'information-we-collect',
        title: 'Information we collect',
        body: (
            <>
                <p>We collect only what we need to run the service:</p>
                <ul>
                    <li><strong>Account details</strong> — your email address, display name and a securely hashed password.</li>
                    <li><strong>Conversations</strong> — the questions you type or record and the answers generated, so you can revisit your history. Voice notes are converted to text; images you attach are used to answer that question.</li>
                    <li><strong>Subscription and billing</strong> — your plan, billing period and token usage. Payments are processed by Stripe; we only keep the card brand, last four digits and expiry date — never your full card number.</li>
                    <li><strong>Support and contact messages</strong> — what you send us through support tickets or the contact form, including your name and email.</li>
                    <li><strong>Technical information</strong> — IP address, browser type and error logs, used to keep the service secure and reliable and to prevent abuse.</li>
                </ul>
            </>
        ),
    },
    {
        id: 'how-we-use',
        title: 'How we use your information',
        body: (
            <ul>
                <li>To create and secure your account and keep you signed in.</li>
                <li>To answer your questions and show your conversation history.</li>
                <li>To process payments, track your monthly token allowance and manage your plan.</li>
                <li>To respond to support requests and messages.</li>
                <li>To detect, prevent and investigate fraud, spam and abuse, and to fix errors.</li>
            </ul>
        ),
    },
    {
        id: 'ai-processing',
        title: 'AI processing',
        body: (
            <>
                <p>
                    To generate answers and transcribe voice notes, the text of your question, relevant study material and any
                    attached images or audio are sent to our AI provider (OpenAI) for processing. We do not use your
                    conversations to advertise to you.
                </p>
                <p>
                    <strong>Please do not enter information that identifies a real patient</strong> (names, record numbers,
                    dates of birth or similar). {siteName} is a study tool and is not designed to store protected health information.
                </p>
            </>
        ),
    },
    {
        id: 'sharing',
        title: 'Who we share information with',
        body: (
            <>
                <p>We do not sell your personal information. We share it only with service providers that help us operate {siteName}:</p>
                <ul>
                    <li><strong>Stripe</strong> — payment processing.</li>
                    <li><strong>OpenAI</strong> — generating answers and transcribing voice notes.</li>
                    <li><strong>Hosting and email providers</strong> — running the service and sending account emails such as password resets.</li>
                </ul>
                <p>We may also disclose information when required by law or to protect the rights and safety of our users and the service.</p>
            </>
        ),
    },
    {
        id: 'cookies',
        title: 'Cookies and local storage',
        body: (
            <p>
                We use only essential cookies and browser storage to keep you signed in, remember your preferences and protect
                forms from spam. We do not use advertising or analytics trackers. See our <Link href="/cookies">Cookie Policy</Link> for details.
            </p>
        ),
    },
    {
        id: 'retention',
        title: 'How long we keep information',
        body: (
            <p>
                We keep your account information and conversation history while your account is active, so you can return to
                it. You can remove individual conversations from your history at any time. Billing records are kept as long as
                required for accounting and legal purposes. Contact and support messages are kept as long as needed to resolve
                your request. You can ask us to delete your account at any time.
            </p>
        ),
    },
    {
        id: 'your-rights',
        title: 'Your rights and choices',
        body: (
            <>
                <p>Depending on where you live, you may have the right to access, correct, export or delete your personal information, and to object to or restrict certain processing.</p>
                <p>You can update your name and password in Settings at any time. For any other request, contact us via {contactLink} and we will respond within the time required by applicable law.</p>
            </>
        ),
    },
    {
        id: 'security',
        title: 'Security',
        body: (
            <p>
                We protect your information with measures such as encrypted connections, hashed passwords, access controls and
                spam and abuse protection. No online service can be guaranteed to be completely secure, so please use a strong,
                unique password and keep it private.
            </p>
        ),
    },
    {
        id: 'children',
        title: "Children's privacy",
        body: (
            <p>{siteName} is intended for students aged 16 and over. We do not knowingly collect information from younger children. If you believe a child has given us personal information, please contact us and we will delete it.</p>
        ),
    },
    {
        id: 'changes',
        title: 'Changes to this policy',
        body: (
            <p>We may update this policy as our service changes. When we make significant changes we will update the date at the top of this page and, where appropriate, notify you in the app or by email.</p>
        ),
    },
    {
        id: 'contact',
        title: 'Contact us',
        body: <p>Questions about this policy or your data? Reach us via {contactLink}.</p>,
    },
]

export default function PrivacyContent() {
    return (
        <LegalPage
            current="/privacy"
            title="Privacy Policy"
            intro={({ siteName }) => `How ${siteName} collects, uses and protects your personal information.`}
            sections={sections}
        />
    )
}
