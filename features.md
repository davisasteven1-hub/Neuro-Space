### **Core Functionality**

* **Real-Time "Doomsday" Countdown:** A prominent, high-precision timer displaying the exact days, hours, and minutes until your next paper starts.
* **Productive Urgency (The Panic Meter):** A dynamic UI theme that shifts colors based on proximity to the exam (e.g., "Panic Red" for < 24 hours and "Caution Yellow" for < 48 hours).
* **Next-Up Visibility:** A "Next Course at a Glance" display that immediately identifies the subject, time, and specific session for the upcoming threat.

### **Contextual Intelligence**

* **Venue Mapping:** Integration of specific exam locations to ensure you are headed to the right hall without checking a PDF.
* **Double-Header Detection:** Special logic for high-intensity days like **Tuesday, February 3rd**, where the app must pivot immediately from the morning countdown (**Circuit Theory**) to the afternoon countdown (**Mobile Comm**) at 12:00 PM.
* **Late-Finish Tracking:** Awareness of late sessions (e.g., **Project Management** on Jan 30th and **Java** on Feb 6th, both ending around 6 PM) to adjust evening study availability.

### **Triage and Efficiency Tools**

* **Study-Hour Adjustment:** A toggle to subtract 8 hours of sleep per day from the absolute countdown, revealing the actual "Study Hours" you have remaining.
* **Emergency Triage Mode:** A filter that strips away non-essential courses to focus only on "EXTREME" and "CRITICAL" urgency subjects (like **DSP**, **Control Theory**, and **Circuit Theory**) when time is low.
* **Zero-Latency Data:** A hard-coded JSON structure based on the **REVISED Final Timetable** to ensure the app works offline and never relies on outdated draft data.

### **The "Cyber-Brutalism" Interface**

* **Dark Mode Focus:** designed to reduce eye strain during late-night study sessions.
* **Monospace Typography:** Using digital clock-style fonts to maintain the "bomb timer" aesthetic and prevent layout shifts as the seconds tick down.
* **Priority Pills:** Color-coded status badges for the queue to visually distinguish between "Hell Week" papers and later exams.