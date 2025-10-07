// Revenue Calculator
function updateRevenueCalculator() {
    const callsPerWeek = parseInt(document.getElementById('callsPerWeek').value) || 0;
    const missedPercentage = parseInt(document.getElementById('missedPercentage').value) || 0;
    const revenuePerCall = parseInt(document.getElementById('revenuePerCall').value) || 0;

    const missedCallsPerWeek = (callsPerWeek * missedPercentage) / 100;
    const annualLostRevenue = missedCallsPerWeek * revenuePerCall * 52;

    document.getElementById('lostRevenue').textContent = `$${annualLostRevenue.toLocaleString()}`;
    
    // Track calculator usage with UTM data
    if (window.UTMTracker && callsPerWeek > 0 && missedPercentage > 0 && revenuePerCall > 0) {
        window.UTMTracker.trackConversion('revenue_calculator_used', {
            calls_per_week: callsPerWeek,
            missed_percentage: missedPercentage,
            revenue_per_call: revenuePerCall,
            calculated_lost_revenue: annualLostRevenue,
            conversion_value: annualLostRevenue // Use calculated revenue as conversion value
        });
    }
}

// Initialize calculator on page load
console.log('Script loaded successfully!');
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    // Set up calculator event listeners
    const calculatorInputs = ['callsPerWeek', 'missedPercentage', 'revenuePerCall'];
    calculatorInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateRevenueCalculator);
        }
    });

    // Initialize calculator
    updateRevenueCalculator();

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add scroll effect to navbar
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = '#ffffff';
            navbar.style.backdropFilter = 'none';
        }
    });

    // Add animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.stat-card, .benefit-card, .pricing-card, .testimonial');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // CTA button interactions
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Add ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Video modal functionality
    const watchDemoBtn = document.getElementById('watchDemoBtn');
    const videoModal = document.getElementById('videoModal');
    const videoClose = document.querySelector('.video-close');
    const demoVideo = document.getElementById('demoVideo');

    if (watchDemoBtn && videoModal && videoClose && demoVideo) {
        // Open modal when Watch Demo button is clicked
        watchDemoBtn.addEventListener('click', function() {
            // Track video demo engagement with UTM data
            if (window.UTMTracker) {
                window.UTMTracker.trackConversion('video_demo_clicked', {
                    button_location: 'hero_section',
                    video_title: 'Answerly AI Voice Agent Demo',
                    conversion_value: 5000 // Estimated value of video engagement
                });
            }
            
            videoModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            demoVideo.play();
        });

        // Close modal when X is clicked
        videoClose.addEventListener('click', function() {
            videoModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
            demoVideo.pause();
            demoVideo.currentTime = 0; // Reset video to beginning
        });

        // Close modal when clicking outside the video
        videoModal.addEventListener('click', function(e) {
            if (e.target === videoModal) {
                videoModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                demoVideo.pause();
                demoVideo.currentTime = 0;
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && videoModal.style.display === 'block') {
                videoModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                demoVideo.pause();
                demoVideo.currentTime = 0;
            }
        });
    }

    // Fresh, minimal day picker logic per request
    const bookingModal = document.getElementById('bookingModal');
    const bookingClose = document.querySelector('.booking-close');
    const bookingBack = document.getElementById('bookingBack');
    const bookDemoBtnHero = document.getElementById('bookDemoBtnHero');
    const bookDemoBtnFinal = document.getElementById('bookDemoBtnFinal');
    const bookDemoBtnPricing = document.getElementById('bookDemoBtnPricing');
    const dateList = document.getElementById('dateList');
    const timeList = document.getElementById('timeList');
    const bookingStatus = document.querySelector('.booking-status');
    const bookingForm = document.getElementById('bookingForm');
    const bfName = document.getElementById('bfName');
    const bfEmail = document.getElementById('bfEmail');
    const bfPhone = document.getElementById('bfPhone');
    const bfSource = document.getElementById('bfSource');

    const DISPLAY_TZ = 'America/Los_Angeles';
    // API base resolution:
    // 1) Meta tag override
    // 2) Local dev over HTTP → localhost:3000
    // 3) HTTPS pages → default to same-origin (works when backend is on the same host, e.g., Cloudflare tunnel)
    const META_API_BASE = (document.querySelector('meta[name="api-base"]') || {}).content || '';
    let API_BASE = META_API_BASE;
    if (!API_BASE) {
        if (window.location.host === 'localhost:8000') {
            API_BASE = 'http://localhost:3000';
        } else if (window.location.protocol === 'http:') {
            API_BASE = 'http://localhost:3000';
        } else {
            API_BASE = `${window.location.origin}`;
        }
    }
    console.log('Using API_BASE:', API_BASE);
    
    // EmailJS Configuration
    const EMAILJS_SERVICE_ID = 'service_tr89jo7';
    const EMAILJS_TEMPLATE_USER = 'template_p0dnoud';
    const EMAILJS_TEMPLATE_INTERNAL = 'template_94x74xo';
    const EMAILJS_PUBLIC_KEY = 'M-mlGlAnHaI8KqLkM';
    
    // Initialize EmailJS
    if (window.emailjs) {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }
    function dayKeyInTZ(date, tz) {
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
            .formatToParts(date)
            .reduce((acc, p) => (acc[p.type] = p.value, acc), {});
        return `${parts.year}-${parts.month}-${parts.day}`;
    }
    let busySlotsData = null; // Cache busy slots data

    async function fetchBusySlots() {
        try {
            const response = await fetch(`${API_BASE}/google/freebusy`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-cache'
            });
            const data = await response.json();
            console.log('Fetched Google Calendar busy slots response:', data);
            
            if (data.error) {
                console.error('Server error:', data.error, data.details);
                return { offers: [], busySlots: [] };
            }
            
            return data;
        } catch (error) {
            console.error('Failed to fetch Google Calendar busy slots:', error);
            return { offers: [], busySlots: [] };
        }
    }

    function isSlotBusy(slotStart, slotEnd, busySlots) {
        if (!busySlots || !Array.isArray(busySlots)) {
            console.log('No busy slots data available');
            return false;
        }
        
        const slotStartTime = new Date(slotStart).getTime();
        const slotEndTime = new Date(slotEnd).getTime();
        
        console.log(`Checking slot ${slotStart} - ${slotEnd} against ${busySlots.length} busy slots`);
        
        const isBusy = busySlots.some(busy => {
            const busyStart = new Date(busy.start).getTime();
            const busyEnd = new Date(busy.end).getTime();
            // Check for overlap with 30-minute buffer
            const overlaps = (slotStartTime < busyEnd && slotEndTime > busyStart);
            if (overlaps) {
                console.log(`Slot overlaps with busy time: ${busy.start} - ${busy.end}`);
            }
            return overlaps;
        });
        
        console.log(`Slot ${slotStart} is ${isBusy ? 'BUSY' : 'AVAILABLE'}`);
        return isBusy;
    }

    function openDayPicker() {
        if (!bookingModal || !dateList || !bookingStatus) return;
        
        // Track booking modal opened with UTM data
        if (window.UTMTracker) {
            window.UTMTracker.trackConversion('demo_booking_started', {
                button_location: 'hero_section',
                action: 'modal_opened',
                conversion_value: 10000 // Estimated value of booking interest
            });
        }
        
        bookingModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        dateList.innerHTML = '';
        if (timeList) timeList.innerHTML = '';
        if (bookingBack) bookingBack.style.display = 'none';
        bookingStatus.textContent = 'Loading available days...';
        
        // Fetch busy slots data
        fetchBusySlots().then(data => {
            busySlotsData = data;
            renderDays();
        });
    }

    function renderDays() {
        if (!dateList || !bookingStatus) return;
        
        dateList.innerHTML = '';
        bookingStatus.textContent = 'Select a day:';
        
        const weekdayFmt = new Intl.DateTimeFormat('en-US', { timeZone: DISPLAY_TZ, weekday: 'short' });
        const labelFmt = new Intl.DateTimeFormat(undefined, { timeZone: DISPLAY_TZ, weekday: 'short', month: 'short', day: 'numeric' });
        
        for (let i = 1; i <= 14; i++) {
            const base = new Date(Date.now() + i * 86400000);
            const wd = weekdayFmt.format(base);
            if (wd === 'Sat' || wd === 'Sun') continue; // exclude weekends
            
            const btn = document.createElement('button');
            btn.className = 'slot-item';
            btn.textContent = labelFmt.format(base);
            btn.disabled = false;
            
            // On click, render time slots for this day
            btn.addEventListener('click', () => showTimePicker(base));
            dateList.appendChild(btn);
        }
    }

    function showTimePicker(selectedDate) {
        if (!timeList || !bookingStatus) return;
        
        if (bookingStatus) bookingStatus.textContent = 'Select a time (Pacific):';
        if (dateList) dateList.style.display = 'none';
        if (bookingBack) bookingBack.style.display = 'inline-block';
        timeList.innerHTML = '';
        if (bookingForm) bookingForm.style.display = 'none';

        const timeFmt = new Intl.DateTimeFormat(undefined, { timeZone: DISPLAY_TZ, hour: 'numeric', minute: '2-digit' });
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: DISPLAY_TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
            .formatToParts(selectedDate)
            .reduce((acc, p) => (acc[p.type] = p.value, acc), {});
        const y = Number(parts.year), m = Number(parts.month), d = Number(parts.day);

        // Filter busy slots to the selected day - compare UTC dates directly
        const selectedDayStart = new Date(selectedDate);
        selectedDayStart.setHours(0, 0, 0, 0);
        const selectedDayEnd = new Date(selectedDayStart);
        selectedDayEnd.setDate(selectedDayEnd.getDate() + 1);
        
        const busyForDay = (busySlotsData?.busySlots || []).filter(b => {
            const busyDate = new Date(b.start);
            return busyDate >= selectedDayStart && busyDate < selectedDayEnd;
        });
        console.log('Busy slots for day', selectedDayStart.toISOString(), 'to', selectedDayEnd.toISOString(), busyForDay);
        const busyStartMsSet = new Set(busyForDay.map(b => new Date(b.start).getTime()));

        // Determine UTC hour that corresponds to 8:00 AM Pacific (handles DST by probing 15:00 vs 16:00 UTC)
        let startUTC = new Date(Date.UTC(y, m - 1, d, 15, 0, 0)); // 8 AM PST = 4 PM UTC, 8 AM PDT = 3 PM UTC
        const labelCheck = timeFmt.format(startUTC);
        if (!labelCheck.startsWith('8')) {
            const alt = new Date(Date.UTC(y, m - 1, d, 16, 0, 0));
            if (timeFmt.format(alt).startsWith('8')) startUTC = alt;
        }

        const endBoundary = new Date(startUTC.getTime() + 9 * 60 * 60 * 1000); // until 5 PM Pacific (9 hours from 8 AM)
        let cursor = new Date(startUTC);
        
        while (true) {
            const slotEnd = new Date(cursor.getTime() + 30 * 60000); // 30-minute slots
            if (slotEnd > endBoundary) break;
            
            const item = document.createElement('button');
            // Fast exact-start match (server emits same grid). Fallback to overlap check.
            const exactBusy = busyStartMsSet.has(cursor.getTime());
            const isBusy = exactBusy || isSlotBusy(cursor.toISOString(), slotEnd.toISOString(), busyForDay);
            
            if (isBusy) {
                item.className = 'slot-item slot-item-busy';
                item.disabled = true;
            } else {
                item.className = 'slot-item';
                item.disabled = false;
                // On selecting an available time, show form and store selection
                const startAt = new Date(cursor.getTime());
                const endAt = new Date(slotEnd.getTime());
                item.addEventListener('click', () => {
                    const selectedStart = new Date(startAt.getTime());
                    const selectedEnd = new Date(endAt.getTime());
                    const dateFmt = new Intl.DateTimeFormat(undefined, { timeZone: DISPLAY_TZ, dateStyle: 'medium' });
                    const timeFmt = new Intl.DateTimeFormat(undefined, { timeZone: DISPLAY_TZ, hour: 'numeric', minute: '2-digit' });
                    const whenText = `${dateFmt.format(selectedStart)}, ${timeFmt.format(selectedStart)} - ${timeFmt.format(selectedEnd)} (Pacific)`;

                    // Show form
                    if (bookingForm) bookingForm.style.display = 'block';
                    if (bookingStatus) bookingStatus.textContent = `Confirm your details for ${whenText}`;

                    // Handle submit once
                    if (bookingForm && !bookingForm.dataset.bound) {
                        bookingForm.dataset.bound = '1';
                        bookingForm.addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const nameVal = bfName ? bfName.value.trim() : '';
                            const emailVal = bfEmail ? bfEmail.value.trim() : '';
                            const phoneVal = bfPhone ? bfPhone.value.trim() : '';
                            const sourceVal = bfSource ? bfSource.value.trim() : '';
                            
                            // Track demo booking completion with UTM data
                            if (window.UTMTracker) {
                                window.UTMTracker.trackConversion('demo_booking_completed', {
                                    attendee_name: nameVal,
                                    attendee_email: emailVal,
                                    attendee_phone: phoneVal,
                                    source: sourceVal,
                                    selected_time: `${dateFmt.format(selectedStart)}, ${timeFmt.format(selectedStart)} - ${timeFmt.format(selectedEnd)}`,
                                    conversion_value: 20000 // $20,000+ value as mentioned in CTA
                                });
                            }

                            // 1) Create calendar event on Google Calendar
                            try {
                                let joinUrl = '';
                                try {
                                    const resp = await fetch(`${API_BASE}/google/book`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            full_name: nameVal,
                                            email: emailVal,
                                            phone: phoneVal,
                                            reason: 'Demo consultation',
                                            start_iso: selectedStart.toISOString(),
                                            duration_min: 30,
                                            notes: sourceVal
                                        })
                                    });
                                    // With service account auth, 401 should not occur unless server misconfigured
                                    const data = await resp.json();
                                    if (data && data.join_url) joinUrl = data.join_url;
                                } catch (e) {
                                    console.warn('Google Calendar booking failed:', e);
                                    alert('Could not create calendar event. Please try again in a moment.');
                                    return;
                                }

                                // 2) Send emails via EmailJS if available
                                if (window.emailjs && typeof emailjs.send === 'function') {
                                    const vars = {
                                        org_name: 'Answerly by Varyon',
                                        support_email: 'info@varyonglobal.com',
                                        attendee_name: nameVal || (emailVal.split('@')[0] || 'Guest'),
                                        attendee_email: emailVal,
                                        attendee_phone: phoneVal,
                                        source: sourceVal,
                                        referral: sourceVal,
                                        start_local: `${dateFmt.format(selectedStart)}, ${timeFmt.format(selectedStart)}`,
                                        end_local: timeFmt.format(selectedEnd),
                                        timezone: 'Pacific',
                                        duration: '30 minutes',
                                        join_url: joinUrl || ''
                                    };
                                    
                                    // Prospect confirmation
                                    if (emailVal) {
                                        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_USER, {
                                            ...vars,
                                            to_email: emailVal,
                                        });
                                        console.log('User confirmation email sent');
                                    }
                                    
                                    // Internal notification
                                    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_INTERNAL, {
                                        ...vars,
                                        to_email: 'info@varyonglobal.com',
                                    });
                                    console.log('Internal notification email sent');
                                }
                                alert('Thanks! Your request has been received. A confirmation email is on the way.');
                                // Close modal
                                if (bookingModal) bookingModal.style.display = 'none';
                                document.body.style.overflow = 'auto';
                            } catch (err) {
                                console.warn('EmailJS send failed', err);
                                alert('Submitted, but failed to send emails automatically. We will follow up.');
                            }
                        });
                    }
                });
            }
            
            item.textContent = `${timeFmt.format(cursor)} - ${timeFmt.format(slotEnd)}`;
            timeList.appendChild(item);
            cursor = new Date(cursor.getTime() + 30 * 60000);
        }
        timeList.style.display = 'grid';
    }

    if (bookingBack) bookingBack.onclick = () => {
        if (timeList) timeList.innerHTML = '';
        if (dateList) { dateList.style.display = 'grid'; }
        bookingBack.style.display = 'none';
        if (bookingStatus) bookingStatus.textContent = 'Select a day:';
    };
    if (bookDemoBtnHero) bookDemoBtnHero.addEventListener('click', openDayPicker);
    if (bookDemoBtnFinal) bookDemoBtnFinal.addEventListener('click', openDayPicker);
    if (bookDemoBtnPricing) bookDemoBtnPricing.addEventListener('click', openDayPicker);
    if (bookingClose) bookingClose.addEventListener('click', () => { bookingModal.style.display = 'none'; document.body.style.overflow = 'auto'; });
    
    // Try AI Agent buttons
    const tryAgentBtn = document.getElementById('tryAgentBtn');
    const tryAgentBtnFinal = document.getElementById('tryAgentBtnFinal');
    
    if (tryAgentBtn) tryAgentBtn.addEventListener('click', openTryAgent);
    if (tryAgentBtnFinal) tryAgentBtnFinal.addEventListener('click', openTryAgent);
    
    // Try AI Agent function
    function openTryAgent() {
        // Track AI agent engagement with UTM data
        if (window.UTMTracker) {
            window.UTMTracker.trackConversion('ai_agent_clicked', {
                action: 'try_ai_agent',
                conversion_value: 15000 // High value for AI agent engagement
            });
        }
        
        // Create and show voice agent modal
        showVoiceAgentModal();
    }
    
    // Voice Agent Modal
    function showVoiceAgentModal() {
        // Check if ElevenLabs widget script is loaded
        if (typeof customElements === 'undefined' || !customElements.get('elevenlabs-convai')) {
            console.error('ElevenLabs widget not loaded yet. Retrying...');
            // Retry after a short delay
            setTimeout(showVoiceAgentModal, 500);
            return;
        }
        
        // Create modal if it doesn't exist
        let voiceModal = document.getElementById('voiceAgentModal');
        if (!voiceModal) {
            voiceModal = document.createElement('div');
            voiceModal.id = 'voiceAgentModal';
            voiceModal.className = 'voice-agent-modal';
            voiceModal.innerHTML = `
                <div class="voice-agent-content">
                    <button class="voice-agent-close" aria-label="Close">&times;</button>
                    <elevenlabs-convai agent-id="agent_4001k6x3bfbfewpa2m1bavjcedqh"></elevenlabs-convai>
                </div>
            `;
            document.body.appendChild(voiceModal);
            
            // Add event listeners
            const closeBtn = voiceModal.querySelector('.voice-agent-close');
            
            closeBtn.addEventListener('click', () => {
                voiceModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
            
            // Close when clicking outside
            voiceModal.addEventListener('click', (e) => {
                if (e.target === voiceModal) {
                    voiceModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }
        
        voiceModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        console.log('ElevenLabs voice agent modal opened with agent ID: agent_4001k6x3bfbfewpa2m1bavjcedqh');
    }
    
    // Contact Modal functionality
    const contactUsBtn = document.getElementById('contactUsBtn');
    const contactUsBtnHero = document.getElementById('contactUsBtnHero');
    const contactUsBtnHeader = document.getElementById('contactUsBtnHeader');
    const contactModal = document.getElementById('contactModal');
    
    function openContactModal(source) {
        // Track contact modal opened with UTM data
        if (window.UTMTracker) {
            window.UTMTracker.trackConversion('contact_modal_opened', {
                action: 'contact_us_clicked',
                source: source,
                conversion_value: 5000 // Estimated value of contact engagement
            });
        }
        
        contactModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    if (contactUsBtn && contactModal) {
        contactUsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openContactModal('footer');
        });
    }
    
    if (contactUsBtnHero && contactModal) {
        contactUsBtnHero.addEventListener('click', function(e) {
            e.preventDefault();
            openContactModal('hero');
        });
    }
    
    if (contactUsBtnHeader && contactModal) {
        contactUsBtnHeader.addEventListener('click', function(e) {
            e.preventDefault();
            openContactModal('header');
        });
    }
    
    // Close contact modal functionality (shared for both buttons)
    if (contactModal) {
        const contactCloseBtn = contactModal.querySelector('.contact-modal-close');
        if (contactCloseBtn) {
            contactCloseBtn.addEventListener('click', function() {
                contactModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }
        
        // Close when clicking outside the modal
        contactModal.addEventListener('click', function(e) {
            if (e.target === contactModal) {
                contactModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
        
        // Close with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && contactModal.style.display === 'flex') {
                contactModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
});

// Seamless hero video playlist using double-buffer videos to avoid gap
(function() {
    const firstSrc = 'media/8eb13f6f-b5e8-4492-a0b3-27c9323a2b1e.mp4';
    const secondSrc = 'media/video2.mp4';
    const a = document.getElementById('heroVideoA');
    const b = document.getElementById('heroVideoB');
    if (!a || !b) return;

    // Initialize sources
    a.src = firstSrc;
    b.src = secondSrc;

    // Instant switch with zero-gap: start next slightly before current ends
    const PRELOAD_SECONDS = 0.05; // start next 50ms before end
    let switching = false;
    const tick = () => {
        const current = a.style.opacity === '0' ? b : a;
        const next = current === a ? b : a;
        if (!current.duration || Number.isNaN(current.duration)) return requestAnimationFrame(tick);
        const remaining = current.duration - current.currentTime;
        if (!switching && remaining <= PRELOAD_SECONDS) {
            switching = true;
            next.currentTime = 0;
            const startNext = () => next.play().then(() => {
                // Swap instantly
                next.style.opacity = '1';
                current.style.opacity = '0';
                switching = false;
            }).catch(() => { switching = false; });
            if (next.readyState >= 2) startNext(); else next.addEventListener('canplay', startNext, { once: true });
        }
        requestAnimationFrame(tick);
    };

    // Start playback chain and monitoring loop
    const startA = () => a.play().catch(() => {});
    if (a.readyState >= 2) startA(); else a.addEventListener('canplay', startA, { once: true });
    requestAnimationFrame(tick);
})();