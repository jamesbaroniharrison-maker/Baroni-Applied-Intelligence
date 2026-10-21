// What the editor shows for each page: sections of fields, each pointing at a
// path in content/content.json. Any text in content.json that no field covers
// still appears under Site-wide -> "Other text", so nothing is ever uneditable.
//
// Field helpers:
//   text(path, label, hint)      one line
//   long(path, label, hint)      a paragraph
//   num(path, label, hint)       a number
//   bool(path, label, hint)      on / off
//   pick(path, label, options)   one of a few choices
//   list(path, label, item, opts) a list you can add to, reorder and delete from;
//                                 item is a field for plain lists, or an array of
//                                 sub-fields (paths relative to the item)

const text = (path, label, hint = '') => ({ type: 'text', path, label, hint });
const long = (path, label, hint = '') => ({ type: 'long', path, label, hint });
const num = (path, label, hint = '') => ({ type: 'num', path, label, hint });
const bool = (path, label, hint = '') => ({ type: 'bool', path, label, hint });
const pick = (path, label, options, hint = '') => ({ type: 'pick', path, label, options, hint });
const list = (path, label, item, opts = {}) => ({ type: 'list', path, label, item, ...opts });

const COLORS = [['manila', 'Cream'], ['sage', 'Sage green'], ['gold', 'Gold']];
const VISUALS = [['voice', 'Writing sample → draft'], ['approval', 'Approval screen'], ['tender', 'Tender result (£ vs £)']];

const caseFields = (base) => [
  text(`${base}.name`, 'Name', 'Shown on the folder and the page title'),
  text(`${base}.line`, 'One-line result', 'On the folder: keep it to one short sentence'),
  text(`${base}.stamp`, 'Stamp', 'e.g. LIVE or STAGE 1'),
  bool(`${base}.live`, 'Live', 'Off shows the stamp in gold instead of green'),
  pick(`${base}.color`, 'Folder colour', COLORS),
  text(`${base}.title`, 'Headline'),
  text(`${base}.titleEm`, 'Headline - gold italic ending'),
  long(`${base}.problem`, 'Problem'),
  long(`${base}.does`, 'What it does'),
  long(`${base}.result`, 'Result'),
  list(`${base}.steps`, 'Steps', text('', 'Step')),
  num(`${base}.youStep`, 'Which step is yours', 'Gets a YOU tag. 0 = none'),
  pick(`${base}.visual`, 'Mock-up', VISUALS),
];

export const NEW_ITEMS = {
  'home.hero.trust': 'New line',
  'home.pipeline.steps': { name: 'New step', detail: 'What happens', await: false },
  'home.facts': 'New fact',
  'home.week.days': { day: 'SAT', jobs: [] },
  'home.week.days.*.jobs': { time: '09:00', name: 'New job', hours: 1, auto: false },
  'how.steps': { name: 'New step', line: 'What happens in this step.', you: 'your part' },
  'how.panel.foot': 'New line',
  'how.checks.items': { title: 'New check', detail: 'One line about it.' },
  'work.stats': { big: '0', small: 'What the number means.' },
  'cases': { name: 'New case', color: 'manila', stamp: 'LIVE', live: true, line: 'One-line result.', title: 'Headline', titleEm: 'gold ending.', problem: 'The problem.', does: 'What it does.', result: 'The result.', steps: ['Step one', 'Step two'], youStep: 0, visual: 'approval' },
  'cases.*.steps': 'New step',
  'visuals.approval.tabs': 'TAB',
  'services.rows': { say: 'Something a client would say.', name: 'Service name', lead: 'Short headline.', body: 'One line on what it is.', link: 'Talk it through on a free call', href: 'book.html' },
  'about.facts': { label: 'LABEL', value: 'Value' },
  'about.creds': { title: 'New qualification', subtitle: 'Where', status: 'completed', note: '', linkUrl: '', linkLabel: '' },
  'book.trust': 'New line',
  'book.faq': { q: 'New question?', a: 'The answer.' },
};

// Pages, in the order of the page picker. `file` is the page the preview shows.
export function pages(content) {
  const out = [
    {
      id: 'home', label: 'Home', file: 'index.html', sections: [
        { label: 'Top of the page', help: 'Headline, buttons and the small print under them.', fields: [
          text('home.hero.eyebrow', 'Small line above the headline'),
          text('home.hero.title', 'Headline'),
          text('home.hero.titleEm', 'Headline - gold italic ending'),
          long('home.hero.sub', 'Line under the headline'),
          text('home.hero.primary', 'Main button', 'Goes to Case files'),
          text('home.hero.secondary', 'Second button', 'Goes to Book a call'),
          list('home.hero.trust', 'Small print under the buttons', text('', 'Line')),
        ] },
        { label: 'Pipeline panel', help: 'The panel on the right of the headline. Its last step, "Fax to head office", is the fixed joke and stays as it is.', fields: [
          text('home.pipeline.label', 'Panel title'),
          text('home.pipeline.live', 'Status word', 'Next to the green dot'),
          list('home.pipeline.steps', 'Steps', [text('name', 'Step'), text('detail', 'Detail'), bool('await', 'Your step', 'Shows AWAITING instead of RUNNING')]),
          text('home.pipeline.foot', 'Link at the bottom', 'Goes to Case 02'),
        ] },
        { label: 'Fact strip', help: 'The facts that scroll between the dotted bars.', fields: [
          list('home.facts', 'Facts', text('', 'Fact')),
        ] },
        { label: 'What I automate (week planner)', help: 'Highlighted jobs are the ones marked "Could run itself". The hours add up as the line sweeps across.', fields: [
          text('home.week.eyebrow', 'Label'),
          text('home.week.title', 'Heading'),
          text('home.week.titleEm', 'Heading - gold italic ending'),
          list('home.week.days', 'Days', [
            text('day', 'Day'),
            list('jobs', 'Jobs', [text('time', 'Time'), text('name', 'Job'), num('hours', 'Hours'), bool('auto', 'Could run itself')]),
          ]),
          text('home.week.scan', 'Label on the sweep line'),
          text('home.week.tag', 'Tag on highlighted jobs'),
          text('home.week.tally', 'Words after the hours total'),
          text('home.week.replay', 'Replay button'),
          text('home.week.go', 'Link when it finishes', 'Goes to How it works'),
          text('home.week.note', 'Small note underneath'),
        ] },
        { label: 'The idea', help: 'The two short lines after the planner.', fields: [
          text('home.idea.eyebrow', 'Label'),
          text('home.idea.line', 'Big line'),
          text('home.idea.lineEm', 'Big line - gold italic ending'),
          text('home.idea.sub', 'Smaller line'),
        ] },
        { label: 'The four tiles', help: 'Links to the other pages. Their titles come from the menu names (Site-wide).', fields: [
          text('home.explore.eyebrow', 'Label'),
          text('home.explore.how.type', 'How it works - small label'),
          text('home.explore.how.line', 'How it works - line'),
          text('home.explore.work.type', 'Case files - small label'),
          text('home.explore.work.line', 'Case files - line'),
          text('home.explore.services.type', 'Services - small label'),
          text('home.explore.services.line', 'Services - line'),
          text('home.explore.about.type', 'About - small label'),
          text('home.explore.about.line', 'About - line'),
          text('home.explore.button', 'Explore word'),
        ] },
        { label: 'Search and sharing', help: 'What Google and link previews show.', fields: [
          text('home.seoTitle', 'Page title'),
        ] },
      ],
    },
    {
      id: 'how', label: 'How it works', file: 'how.html', sections: [
        { label: 'Top of the page', fields: [
          text('how.title', 'Big title'),
          text('how.lead', 'Line under the title'), text('how.leadEm', 'Line - gold italic ending'),
        ] },
        { label: 'The steps panel', fields: [
          text('how.panel.label', 'Panel title'),
          list('how.steps', 'Steps', [text('name', 'Step'), long('line', 'What happens'), text('you', 'Your part')]),
          text('how.panel.yourPart', 'Words before "your part"'),
          list('how.panel.foot', 'Bottom of the panel', text('', 'Line')),
          text('how.panel.ready', 'Status before it runs'),
          text('how.panel.running', 'Status while running'),
          text('how.panel.live', 'Status when done'),
        ] },
        { label: 'Safety checks', fields: [
          text('how.checks.label', 'Label'),
          list('how.checks.items', 'Checks', [text('title', 'Check'), text('detail', 'Detail')]),
          text('how.checks.passed', 'Word after the count', 'e.g. 4 / 4 passed'),
          text('how.checks.pass', 'Tag on each check'),
          long('how.gdpr', 'GDPR line'),
          text('how.privacyLink', 'Privacy link'),
        ] },
        { label: 'Search and sharing', fields: [text('how.seoTitle', 'Page title')] },
      ],
    },
    {
      id: 'work', label: 'Case files', file: 'work.html', sections: [
        { label: 'Top of the page', fields: [
          text('work.title', 'Big title'),
          text('work.lead', 'Line under the title'), text('work.leadEm', 'Line - gold italic ending'),
          text('work.hint', 'Small line above the folders'),
        ] },
        { label: 'The case files', help: 'Add, remove or reorder case studies here. Each one gets its own page; open it from the page picker to edit it in full.', fields: [
          list('cases', 'Case studies', caseFields('').map((f) => ({ ...f, path: f.path.replace(/^\./, '') })), { summary: 'name' }),
        ] },
        { label: 'Results strip', fields: [
          list('work.stats', 'Results', [text('big', 'Big number'), text('small', 'What it means')]),
        ] },
        { label: 'Bottom band', fields: [text('work.ctaTitle', 'Line'), text('work.ctaTitleEm', 'Line - gold italic ending')] },
        { label: 'Search and sharing', fields: [text('work.seoTitle', 'Page title')] },
      ],
    },
  ];
  (content.cases || []).forEach((cs, i) => {
    out.push({
      id: `case-${i}`, label: `Case ${String(i + 1).padStart(2, '0')}: ${cs.name}`, file: `case-${i + 1}.html`, indent: true, sections: [
        { label: 'This case study', fields: caseFields(`cases.${i}`) },
        { label: `Mock-up: ${(VISUALS.find((v) => v[0] === cs.visual) || ['', cs.visual])[1]}`, help: 'Shared by every case that uses this mock-up.', fields: visualFields(cs.visual) },
        { label: 'Words on every case page', help: 'Shared by all case pages.', fields: [
          text('caseFile.problem', 'Problem label'), text('caseFile.does', 'What it does label'), text('caseFile.result', 'Result label'),
          text('caseFile.foot', 'Line at the bottom'), text('caseFile.button', 'Button'),
          text('caseFile.back', 'Back link'), text('caseFile.nextFile', 'Next file label'),
          text('caseFile.open', 'Open file (on folders)'), text('caseFile.caseWord', 'The word CASE'), text('caseFile.you', 'Tag on your step'),
        ] },
      ],
    });
  });
  out.push(
    {
      id: 'services', label: 'Services', file: 'services.html', sections: [
        { label: 'Top of the page', fields: [
          text('services.title', 'Big title'),
          text('services.lead', 'Line under the title'), text('services.leadEm', 'Line - gold italic ending'),
          pick('services.layout', 'Layout', [['picker', 'Pick your problem (answer alongside)'], ['cards', 'Cards that turn over'], ['chat', 'Conversation']]),
          text('services.say', 'Label for the client lines', 'e.g. You say'),
        ] },
        { label: 'Services', help: 'Each row: what a client would say, then the service that answers it. How they are shown is set by Layout above.', fields: [
          list('services.rows', 'Rows', [
            long('say', 'What the client says'), text('name', 'Service name'), text('lead', 'Short headline'),
            long('body', 'One line on what it is'), text('link', 'Link text'),
            text('href', 'Link goes to', 'case-1.html, book.html, or a full web or mailto: address'),
          ], { summary: 'name' }),
        ] },
        { label: 'Search and sharing', fields: [text('services.seoTitle', 'Page title')] },
      ],
    },
    {
      id: 'about', label: 'About', file: 'about.html', sections: [
        { label: 'Top of the page', fields: [text('about.back', 'Back link'), text('about.title', 'Big title')] },
        { label: 'About you', fields: [
          long('about.bio', 'Bio'),
          list('about.facts', 'Facts', [text('label', 'Label'), text('value', 'Value')]),
        ] },
        { label: 'Background', fields: [
          text('about.backgroundLabel', 'Label'),
          list('about.creds', 'Qualifications', [
            text('title', 'Title'), text('subtitle', 'Where / what'),
            pick('status', 'Status', [['completed', 'Completed'], ['in_progress', 'In progress'], ['link', 'Link to verify']]),
            text('note', 'Note', 'e.g. Completing in 2027'),
            text('linkUrl', 'Verify link', 'Only used when Status is "Link to verify"'), text('linkLabel', 'Verify link text'),
          ], { summary: 'title' }),
          text('about.statusWords.completed', 'Word for Completed'),
          text('about.statusWords.in_progress', 'Word for In progress'),
        ] },
        { label: 'Quote', fields: [long('about.quote', 'Quote')] },
        { label: 'Search and sharing', fields: [text('about.seoTitle', 'Page title')] },
      ],
    },
    {
      id: 'book', label: 'Book a call', file: 'book.html', sections: [
        { label: 'Top of the page', fields: [
          text('book.eyebrow', 'Label'), text('book.title', 'Heading'), text('book.titleEm', 'Heading - gold italic ending'),
          long('book.body', 'Line under the heading'),
          list('book.trust', 'Small print', text('', 'Line')),
          text('book.copy', 'Copy button'), text('book.copied', 'Copy button after copying'),
        ] },
        { label: 'The form', fields: [
          text('book.form.head', 'Form title'),
          text('book.form.name', 'Name label'), text('book.form.namePlaceholder', 'Name placeholder'),
          text('book.form.email', 'Email label'), text('book.form.emailPlaceholder', 'Email placeholder'),
          text('book.form.message', 'Message label'), text('book.form.messageHint', 'Message hint'), text('book.form.messagePlaceholder', 'Message placeholder'),
          text('book.form.submit', 'Send button'), text('book.form.price', 'Line under the button'),
        ] },
        { label: 'Form messages', help: 'What people see after they press Send.', fields: [
          text('book.form.thanks', 'Thank-you word', 'Shown as "Thanks, <name>."'),
          long('book.form.sentMail', 'Sent (opened their email app)'), long('book.form.sent', 'Sent'),
          text('book.form.missing', 'Name or email missing'), text('book.form.wait', 'Sent too fast'),
          text('book.form.check', 'Something not valid'), long('book.form.failed', 'Could not send'),
          text('book.form.emptyNote', 'Used when the message box is empty'), text('book.form.again', 'Send another'),
        ] },
        { label: 'Questions (FAQ)', fields: [
          text('book.faqEyebrow', 'Label'), text('book.faqTitle', 'Heading'), text('book.faqTitleEm', 'Heading - gold italic ending'),
          list('book.faq', 'Questions', [text('q', 'Question'), long('a', 'Answer')], { summary: 'q' }),
          text('book.tap', 'Hint on each card'),
        ] },
        { label: 'Search and sharing', fields: [text('book.seoTitle', 'Page title')] },
      ],
    },
    {
      id: 'site', label: 'Site-wide', file: 'index.html', sections: [
        { label: 'Contact details', help: 'Used everywhere: the form, the footer and the links.', fields: [
          text('site.email', 'Email address'), text('site.linkedin', 'LinkedIn address'), text('site.github', 'GitHub address'),
          text('site.formEndpoint', 'Form sends to', 'Your Google Apps Script address. Leave empty to open the visitor\'s email app instead.'),
        ] },
        { label: 'Menu', help: 'Also used as the page titles on the home tiles and the Next links.', fields: [
          text('site.nav.home', 'Home'), text('site.nav.how', 'How it works'), text('site.nav.work', 'Case files'),
          text('site.nav.services', 'Services'), text('site.nav.about', 'About'), text('site.nav.book', 'Book a call button'),
          text('site.nav.menu', 'Menu button (phones)'),
        ] },
        { label: 'Bottom of every page', fields: [
          text('site.cta.title', 'Band line'), text('site.cta.titleEm', 'Band line - gold italic ending'), text('site.cta.button', 'Band button'),
          text('site.next.label', 'Next label (big link at the bottom of every page)'), text('site.next.home', 'Next on the last page'),
          text('site.signOff.word', 'Big word under the sunflower'), text('site.signOff.tag', 'Line under it'),
          text('site.footer.name', 'Footer name'), text('site.footer.role', 'Footer role'), text('site.footer.pm', 'AI PM link'),
          text('site.footer.privacy', 'Privacy link'), text('site.footer.toTop', 'Back to top (under the sunflower)'),
        ] },
        { label: 'Phone bar', help: 'The bar along the bottom on phones.', fields: [
          text('site.mobileBar.line1', 'First line'), text('site.mobileBar.line2', 'Second line'), text('site.mobileBar.button', 'Button'),
        ] },
        { label: 'Name and search', fields: [
          text('site.name', 'Business name'), text('site.person', 'Your name'), text('site.jobTitle', 'Job title (for Google)'),
          long('site.description', 'Description', 'What Google and link previews show under the title, on every page'),
          text('site.logoTag', 'Line next to the logo'), text('site.url', 'Site address'),
        ] },
      ],
    },
  );
  return out;
}

export function visualFields(kind) {
  if (kind === 'approval') return [
    text('visuals.approval.title', 'Window title'), list('visuals.approval.tabs', 'Tabs', text('', 'Tab')),
    long('visuals.approval.text', 'Draft post'), text('visuals.approval.publish', 'Approve button'),
    text('visuals.approval.edit', 'Edit button'), text('visuals.approval.tag', 'Tag'),
  ];
  if (kind === 'voice') return [
    text('visuals.voice.sampleLabel', 'Sample label'), long('visuals.voice.sample', 'Their writing'),
    text('visuals.voice.draftLabel', 'Draft label'), text('visuals.voice.ok', 'Check tag'), long('visuals.voice.draft', 'The draft'),
  ];
  if (kind === 'tender') return [
    text('visuals.tender.eyebrow', 'Label'), num('visuals.tender.from', 'Cover held (£m)'), num('visuals.tender.to', 'Cover required (£m)'),
    text('visuals.tender.vs', 'VS'), long('visuals.tender.note', 'Note'), text('visuals.tender.pill', 'Tag'),
    text('visuals.tender.verdictLabel', 'Verdict label'), text('visuals.tender.verdict', 'Verdict'),
  ];
  return [];
}
