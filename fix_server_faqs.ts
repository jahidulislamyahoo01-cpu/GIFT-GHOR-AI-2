import fs from 'fs';

let file = fs.readFileSync('server.ts', 'utf-8');

// Replace the FAQs
const oldFaqs = `faqs: [
    {
      id: 'faq-1',
      question: 'ডেলিভারি চার্জ কত এবং কতদিন সময় লাগে?',
      answer: 'ঢাকার ভিতরে ডেলিভারি চার্জ মাত্র ৮০ টাকা (২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি)। ঢাকার বাইরে ডেলিভারি চার্জ ১৩০ টাকা (২ থেকে ৪ দিনের মধ্যে ডেলিভারি)। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।',
      category: 'delivery',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'faq-2',
      question: 'অর্ডার কনফার্ম করতে কি কি তথ্য লাগে?',
      answer: 'অর্ডার করতে আপনার পূর্ণ নাম, সম্পূর্ণ ঠিকানা (জেলা ও থানা সহ), সচল মোবাইল নম্বর এবং আপনি কোন প্রোডাক্টটি কাস্টমাইজ করতে চান তা লিখে আমাদের চ্যাটে পাঠালেই হবে। আমাদের টিম আপনার সাথে ফোনে যোগাযোগ করবে।',
      category: 'order',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'faq-3',
      question: 'কাস্টমাইজেশনের জন্য ছবি ও নাম কিভাবে দিব?',
      answer: 'চ্যাটে মেসেজ পাঠানোর পর অথবা অর্ডার নোটের সাথে ছবি শেয়ার করতে পারেন। এছাড়াও আমাদের অফিসিয়াল হোয়াটসঅ্যাপ নম্বরে অর্ডার আইডি উল্লেখ করে হাই-রেজুলেশন ছবি পাঠাতে পারেন। প্রিন্ট করার আগে আমরা ডিজিটাল ড্রাফট দেখাই।',
      category: 'customization',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'faq-4',
      question: 'অগ্রিম কোনো টাকা দিতে হবে কি?',
      answer: 'আমাদের অধিকাংশ নিয়মিত প্রোডাক্টে কোনো প্রকার অগ্রিম ছাড়াই সম্পূর্ণ ক্যাশ অন ডেলিভারিতে নিতে পারবেন। তবে নাম ও ছবি খোদাই করা বিশেষ কাস্টমাইজড আইটেমে শুধুমাত্র ডেলিভারি চার্জ অগ্রিম বিকাশ/নগদে প্রযোজ্য হতে পারে।',
      category: 'payment',
      updatedAt: new Date().toISOString(),
    },
  ],`;

const newFaqs = `faqs: [
    {
      id: 'faq-1',
      question: 'ডেলিভারি চার্জ কত এবং কতদিন সময় লাগে?',
      answer: 'ঢাকার ভিতরে ডেলিভারি চার্জ ৭০ টাকা (২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি)। ঢাকার বাইরে ডেলিভারি চার্জ ১৩০ টাকা (২ থেকে ৪ দিনের মধ্যে ডেলিভারি)। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।',
      category: 'delivery',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'faq-2',
      question: 'অর্ডার কনফার্ম করতে কি কি তথ্য লাগে?',
      answer: 'অর্ডার করতে আপনার পূর্ণ নাম, সম্পূর্ণ ঠিকানা (জেলা ও থানা সহ), সচল মোবাইল নম্বর এবং আপনি কোন প্রোডাক্টটি নিতে চান তা লিখে আমাদের চ্যাটে পাঠালেই হবে।',
      category: 'order',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'faq-4',
      question: 'অগ্রিম কোনো টাকা দিতে হবে কি?',
      answer: 'আমাদের সকল প্রোডাক্ট কোনো প্রকার অগ্রিম ছাড়াই সম্পূর্ণ ক্যাশ অন ডেলিভারিতে নিতে পারবেন।',
      category: 'payment',
      updatedAt: new Date().toISOString(),
    },
  ],`;

file = file.replace(oldFaqs, newFaqs);

// clear sessions
const oldSessionsTarget = `sessions: {
    'session-demo-1':`;
const newSessionsTarget = `sessions: {}, // No default sessions
    /*`;
// Actually, it's easier to just regex out the whole session object if I can't match it easily.
// Let's just find the index of "sessions: {" and the end.
const sessionStart = file.indexOf('sessions: {');
let sessionEnd = -1;
if (sessionStart > -1) {
  let bracketCount = 0;
  let started = false;
  for (let i = sessionStart + 9; i < file.length; i++) {
    if (file[i] === '{') {
      bracketCount++;
      started = true;
    } else if (file[i] === '}') {
      bracketCount--;
    }
    if (started && bracketCount === 0) {
      sessionEnd = i;
      break;
    }
  }
}

if (sessionStart > -1 && sessionEnd > -1) {
  file = file.substring(0, sessionStart) + 'sessions: {}' + file.substring(sessionEnd + 1);
}

fs.writeFileSync('server.ts', file);
console.log('Fixed FAQs and cleared sessions in server.ts');
