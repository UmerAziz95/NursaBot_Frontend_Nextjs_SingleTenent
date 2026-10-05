'use client'

import { useState } from 'react'
import BrandMark from '@/sections/assistant/BrandMark'
import ChatMarkdown from '@/sections/assistant/ChatMarkdown'
import { ANSWER_MODES, DEFAULT_ANSWER_MODE } from '@/sections/assistant/answerModes'
import { useAppSettings } from '@/lib/app-settings'
import SectionHeading from '@/sections/home/SectionHeading'

const QUESTION = 'What is hyperkalemia?'

// Illustrative answers showing how each mode shapes the same question.
const SAMPLES = {
    balanced: `**Hyperkalemia** is a serum potassium level above **5.0 mEq/L**.

- **Causes:** kidney failure, potassium-sparing diuretics, ACE inhibitors, tissue breakdown
- **Signs:** muscle weakness, paresthesias, dysrhythmias
- **ECG:** tall, peaked T waves; widened QRS

**Nursing consideration:** place the patient on a cardiac monitor and report rising levels promptly.`,
    short: `**Hyperkalemia** is serum potassium **> 5.0 mEq/L**. The biggest danger is cardiac — watch for **peaked T waves** and dysrhythmias, and keep the patient on a monitor.`,
    detailed: `### What it is
Serum potassium **> 5.0 mEq/L**, usually from reduced renal excretion or a shift of K⁺ out of cells.

### Assessment
| Finding | Why it matters |
|---|---|
| Peaked T waves, wide QRS | Risk of lethal dysrhythmias |
| Muscle weakness | Can progress to paralysis |

### Interventions
1. Continuous cardiac monitoring
2. **IV calcium gluconate** to stabilize the myocardium
3. Insulin + dextrose to shift K⁺ into cells`,
    simple: `Hyperkalemia means there is **too much potassium in the blood**.

Potassium helps your heart and muscles work. Think of it like the **volume knob** on the heart's electrical signals — too much turns things up so high the rhythm can become unsafe. That's why nurses watch the heart monitor closely.`,
    exam: `**Must know:** K⁺ > 5.0 mEq/L → **cardiac risk is the priority**.

🧠 *Mnemonic — MURDER:* Muscle weakness, Urine changes, Respiratory distress, Decreased contractility, ECG changes, Reflexes.

**Practice question:** Which ECG change is expected?
A. Prominent U waves  **B. Tall, peaked T waves ✓**  C. ST depression  D. Flat T waves`,
}

export default function LearnSection() {
    const { settings } = useAppSettings()
    const siteName = settings.site_name || 'nclexium'
    const [mode, setMode] = useState(DEFAULT_ANSWER_MODE)
    const active = ANSWER_MODES.find((item) => item.key === mode) || ANSWER_MODES[0]

    return (
        <section className="nbl-section" id="answer-modes">
            <div className="nbl-container nbl-modes">
                <div className="nbl-modes-copy">
                    <SectionHeading
                        align="left"
                        eyebrow="Answer modes"
                        title="The same question, answered the way you need it"
                        text="Skimming before a shift? Go Short. Reviewing a whole topic? Go Detailed. Cramming for boards? Exam prep adds a practice question every time."
                    />
                    <div className="nbl-mode-tabs" role="tablist" aria-label="Answer modes">
                        {ANSWER_MODES.map(({ key, label, description, icon: Icon }) => (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={mode === key}
                                className={`nbl-mode-tab ${mode === key ? 'is-active' : ''}`}
                                onClick={() => setMode(key)}
                            >
                                <span className="nbl-mode-tab-icon"><Icon className="h-4 w-4" /></span>
                                <span className="min-w-0 text-left">
                                    <span className="nbl-mode-tab-label">{label}</span>
                                    <span className="nbl-mode-tab-desc">{description}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="nbl-modes-demo nb-chat" role="tabpanel" aria-label={`${active.label} example`}>
                    <div className="nbl-demo-thread">
                        <div className="nb-msg nb-msg-user">
                            <div className="nb-msg-user-bubble">{QUESTION}</div>
                        </div>
                        <div key={mode} className="nb-msg nb-msg-ai">
                            <BrandMark size="sm" />
                            <div className="min-w-0 flex-1">
                                <div className="nb-msg-head">
                                    <span className="nb-msg-author">{siteName}</span>
                                    <span className="nb-msg-mode">{active.label}</span>
                                </div>
                                <ChatMarkdown>{SAMPLES[mode]}</ChatMarkdown>
                            </div>
                        </div>
                    </div>
                    <div className="nbl-demo-note">Example output. Always verify clinical information with your instructors and current guidelines.</div>
                </div>
            </div>
        </section>
    )
}
