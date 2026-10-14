/* =====================================================================
   SPM GO! — exam schedule & settings
   Author: heyziq05 (https://github.com/heyziq05)
   ---------------------------------------------------------------------
   This is the only file you need to edit to update the app.

   • Change the year in SPM_CONFIG.year — every date below uses it.
   • Each exam: date 'MM-DD', subject, optional paper detail, and the
     module ids it belongs to (see SPM_MODULES).
   • Optional per-exam times: start: 'HH:MM', end: 'HH:MM' (24h, Malaysia
     time). Without them, defaultStart / defaultEnd are used.
     The countdown targets the START time; a paper counts as finished at
     its END time.
   ===================================================================== */

window.SPM_CONFIG = {
  year: 2026,                     // <- SPM year (edit this each year)
  utcOffset: '+08:00',            // Malaysia Time (MYT)
  timeZone: 'Asia/Kuala_Lumpur',
  defaultStart: '08:00',
  defaultEnd: '17:00',
  minDayDigits: 3,                // flip-calendar shows at least this many digits
  githubUrl: 'https://github.com/heyziq05',
  githubHandle: 'heyziq05',
};

window.SPM_MODULES = [
  { id: 'bertulis',  name: 'Ujian Bertulis',  label: 'Written',   icon: 'pen' },
  { id: 'amali',     name: 'Ujian Amali',     label: 'Practical', icon: 'flask' },
  { id: 'mendengar', name: 'Ujian Mendengar', label: 'Listening', icon: 'headphones' },
  { id: 'bertutur',  name: 'Ujian Bertutur',  label: 'Speaking',  icon: 'speech' },
];

window.SPM_EXAMS = [
  { date: '10-26', subject: 'Bahasa Melayu',      paper: 'Ujian Bertutur',      modules: ['bertutur'] },
  { date: '11-02', subject: 'Bahasa Inggeris',    paper: 'Ujian Bertutur',      modules: ['bertutur'] },

  { date: '11-16', subject: 'Fizik',              paper: 'Ujian Amali',         modules: ['amali'] },
  { date: '11-17', subject: 'Kimia',              paper: 'Ujian Amali',         modules: ['amali'] },
  { date: '11-18', subject: 'Biologi',            paper: 'Ujian Amali',         modules: ['amali'] },

  { date: '11-23', subject: 'Bahasa Melayu',      paper: 'Dengar / Tulis',      modules: ['bertulis', 'mendengar'] },
  { date: '11-24', subject: 'Bahasa Inggeris',    paper: 'Dengar / Tulis',      modules: ['bertulis', 'mendengar'] },
  { date: '11-25', subject: 'Pendidikan Islam',   paper: '',                    modules: ['bertulis'] },
  { date: '11-26', subject: 'Matematik',          paper: 'Kertas 1 & Kertas 2', modules: ['bertulis'] },
  { date: '11-30', subject: 'Sejarah',            paper: 'Kertas 1 & Kertas 2', modules: ['bertulis'] },
  { date: '12-02', subject: 'Biologi',            paper: 'Kertas 1 & Kertas 2', modules: ['bertulis'] },
  { date: '12-03', subject: 'Fizik',              paper: 'Kertas 1 & Kertas 2', modules: ['bertulis'] },
  { date: '12-15', subject: 'Kimia',              paper: 'Kertas 1 & Kertas 2', modules: ['bertulis'] },
  { date: '12-17', subject: 'Matematik Tambahan', paper: 'Kertas 1 & Kertas 2', modules: ['bertulis'] },
];
