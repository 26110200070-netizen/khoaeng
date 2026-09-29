// KhoaEng Web Audio Sound Synthesizer
// Clean, tactile, satisfying sounds using native Web Audio API (zero external assets)

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('khoaeng_sound_muted') === 'true';
    }

    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('khoaeng_sound_muted', this.muted);
        if (!this.muted) {
            this.playTap();
        }
        return this.muted;
    }

    isMuted() {
        return this.muted;
    }

    // Soft tactile click for selecting options
    playTap() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.06);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.07);
    }

    // Pleasant two-tone chime when opening Khoa Eng hint
    playHint() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [659.25, 880.0]; // E5, A5
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.15, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.26);
        });
    }

    // Subtle woosh/tick for navigation
    playNav() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(550, now + 0.05);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    // Fanfare / Celebration based on score (0 - 10)
    playFanfare(score) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        if (score >= 8.0) {
            // Triumphant victory arpeggio: C5 -> E5 -> G5 -> C6
            const melody = [
                { freq: 523.25, time: 0.0, dur: 0.15 },
                { freq: 659.25, time: 0.14, dur: 0.15 },
                { freq: 783.99, time: 0.28, dur: 0.18 },
                { freq: 1046.50, time: 0.44, dur: 0.55 }
            ];

            melody.forEach(note => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note.freq, now + note.time);

                gain.gain.setValueAtTime(0.2, now + note.time);
                gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + note.time);
                osc.stop(now + note.time + note.dur + 0.05);
            });
        } else if (score >= 5.0) {
            // Encouraging sweet triad: C5 -> G5
            const melody = [
                { freq: 523.25, time: 0.0, dur: 0.18 },
                { freq: 659.25, time: 0.15, dur: 0.18 },
                { freq: 783.99, time: 0.32, dur: 0.45 }
            ];

            melody.forEach(note => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(note.freq, now + note.time);

                gain.gain.setValueAtTime(0.16, now + note.time);
                gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + note.time);
                osc.stop(now + note.time + note.dur + 0.05);
            });
        } else {
            // Gentle warm chime
            const melody = [
                { freq: 440.0, time: 0.0, dur: 0.25 },
                { freq: 554.37, time: 0.2, dur: 0.4 }
            ];

            melody.forEach(note => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(note.freq, now + note.time);

                gain.gain.setValueAtTime(0.12, now + note.time);
                gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + note.time);
                osc.stop(now + note.time + note.dur + 0.05);
            });
        }
    }
}

window.khoaSound = new SoundEngine();
