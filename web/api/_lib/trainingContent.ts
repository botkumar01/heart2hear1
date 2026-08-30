export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  explanation: string[];
  examples: string[];
  scenario: {
    prompt: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  quiz: QuizQuestion[];
}

/**
 * The Heart2Hear helper training curriculum. Authored here as the single
 * source of truth for both content and grading — server-side only, never
 * shipped to the client with answer keys attached (see
 * web/api/getTrainingContent.ts, which strips correctIndex/explanation
 * before sending lesson content, and only reveals them after a quiz is
 * submitted and graded server-side).
 */
export const TRAINING_LESSONS: Lesson[] = [
  {
    id: "active-listening",
    title: "Active Listening & Empathy",
    explanation: [
      "Active listening means giving someone your full attention, reflecting back what you hear, and asking open-ended questions instead of jumping to advice or solutions.",
      "Empathy is not the same as sympathy. Sympathy is feeling sorry for someone; empathy is trying to understand what they're feeling, from their perspective, without judgment.",
      "Open-ended questions ('How did that make you feel?', 'What's been on your mind?') invite someone to share more. Closed questions ('Are you okay?') tend to shut a conversation down.",
    ],
    examples: [
      "Instead of: 'You shouldn't feel that way.' Try: 'That sounds really hard. Can you tell me more about what's going on?'",
      "Instead of: 'I know exactly how you feel.' Try: 'I can hear how much this is weighing on you.'",
    ],
    scenario: {
      prompt: "A client writes: \"I've just been feeling really off lately, I don't even know why.\"",
      question: "What's the best first response?",
      options: [
        "\"You should try exercising more, it always helps me.\"",
        "\"That sounds tough. Do you want to tell me a bit more about what 'off' has felt like?\"",
        "\"That's probably just stress, it'll pass.\"",
        "\"Have you considered you might have depression?\"",
      ],
      correctIndex: 1,
      explanation:
        "The best response invites them to share more, without minimizing their feelings, giving unsolicited advice, or diagnosing.",
    },
    quiz: [
      {
        id: "al-1",
        question: "What is the main goal of active listening?",
        options: [
          "To quickly solve the person's problem",
          "To fully understand and reflect what someone is expressing",
          "To share your own similar experience",
          "To keep the conversation moving quickly",
        ],
        correctIndex: 1,
        explanation: "Active listening is about understanding and reflecting, not solving or redirecting.",
      },
      {
        id: "al-2",
        question: "Which of these is an open-ended question?",
        options: ["\"Are you feeling better?\"", "\"Did that upset you?\"", "\"What's been going on for you?\"", "\"Is everything okay at home?\""],
        correctIndex: 2,
        explanation: "Open-ended questions can't be answered with a simple yes/no — they invite more sharing.",
      },
      {
        id: "al-3",
        question: "A client shares something painful. What best shows empathy?",
        options: [
          "Immediately offering a solution",
          "Reflecting their feeling back and staying present with them",
          "Changing the subject to something lighter",
          "Telling them about a time you felt the same way",
        ],
        correctIndex: 1,
        explanation: "Reflecting feeling back and staying present validates the person without centering yourself.",
      },
    ],
  },
  {
    id: "boundaries",
    title: "Boundaries & What You Must Never Do",
    explanation: [
      "As a Heart2Hear helper, you are a trained listener — not a doctor, therapist, or counselor. This distinction protects both you and the people you're supporting.",
      "You must never diagnose a condition, recommend or discuss specific medication or dosages, tell someone to change or stop medication, or claim professional credentials you don't have.",
      "You must never request money, ask for a client's contact details outside the platform, or try to move the conversation to a personal number/social media.",
      "When a client asks for something outside your role, the skill isn't refusing coldly — it's redirecting warmly: acknowledge the request, explain your role, and point them toward the right kind of help.",
    ],
    examples: [
      "Client: \"What medicine should I take for this?\" You: \"That's something a doctor is really the right person to answer safely — I can't recommend medication. What I can do is listen, and help you think through finding the right professional if that would help.\"",
      "Client: \"Can I get your personal number?\" You: \"I keep all my support conversations on Heart2Hear so everything stays safe and on record for both of us — I'm still very much here for you here.\"",
    ],
    scenario: {
      prompt: "A client says: \"I feel terrible and I think I need antidepressants. Which medicine should I take?\"",
      question: "What is the correct helper response?",
      options: [
        "Recommend a commonly-used antidepressant and typical starting dose",
        "Say you can't discuss medication, but you're glad to keep listening, and suggest speaking with a licensed professional",
        "Tell them to just push through it without medication",
        "Ask which pharmacy is near them",
      ],
      correctIndex: 1,
      explanation: "Never recommend medication. Respond empathetically and redirect to a qualified professional — this is a direct example from the platform's safety policy.",
    },
    quiz: [
      {
        id: "b-1",
        question: "A client asks you to recommend a specific medication. What should you do?",
        options: [
          "Suggest a mild, commonly-used one",
          "Explain you can't give medical advice, and encourage them to consult a professional",
          "Ask a friend who's a nurse and relay their answer",
          "Recommend they search online for the best option",
        ],
        correctIndex: 1,
        explanation: "Medication guidance is always outside a helper's role, regardless of how the question is phrased.",
      },
      {
        id: "b-2",
        question: "Which of these is a helper allowed to say?",
        options: [
          "\"You have generalized anxiety disorder.\"",
          "\"You should stop taking your medication if it's not working.\"",
          "\"I'm not a doctor, but I'm here to listen and support you.\"",
          "\"I'm basically a therapist, so you can trust my advice on this.\"",
        ],
        correctIndex: 2,
        explanation: "Helpers should be transparent about their role and stick to supportive listening, never diagnosis or claimed credentials.",
      },
      {
        id: "b-3",
        question: "A client asks to continue talking on WhatsApp instead of the platform. Best response?",
        options: [
          "Agree, since it's more convenient",
          "Share your number only if they insist",
          "Explain that conversations stay on Heart2Hear to keep things safe for both of you",
          "Ignore the request entirely",
        ],
        correctIndex: 2,
        explanation: "Keeping conversations on-platform protects both the client and the helper, and is a hard boundary.",
      },
    ],
  },
  {
    id: "confidentiality-culture",
    title: "Confidentiality & Cultural Sensitivity",
    explanation: [
      "What a client shares with you is private. Don't discuss specifics of a conversation with anyone outside Heart2Hear's official safety/reporting channels.",
      "Confidentiality has one necessary exception: if you believe someone is in immediate danger, safety comes first — use the in-chat safety tools to escalate rather than trying to handle it yourself.",
      "Heart2Hear supports people across languages, ages, and backgrounds. Avoid assumptions about someone's beliefs, family structure, or culture. What feels supportive in one culture can feel dismissive in another — when unsure, ask rather than assume.",
    ],
    examples: [
      "Don't: bring up a previous client's situation in a different conversation, even anonymized in detail.",
      "Do: if a client mentions a cultural or religious practice you're unfamiliar with, respond with curiosity and respect rather than judgment or assumption.",
    ],
    scenario: {
      prompt: "A client mentions a family expectation that conflicts with what they want for themselves.",
      question: "What's the most appropriate helper response?",
      options: [
        "Tell them their family is wrong and they should ignore them",
        "Listen without judgment and help them explore their own feelings about it",
        "Say that's just how families are in their culture, so they should accept it",
        "Change the subject since it's a sensitive topic",
      ],
      correctIndex: 1,
      explanation: "Stay neutral and supportive — the client's own feelings and choices are what matter here, not your opinion of their family or culture.",
    },
    quiz: [
      {
        id: "cc-1",
        question: "When should you break confidentiality about a conversation?",
        options: [
          "Never, under any circumstance",
          "Whenever you find the conversation interesting",
          "When you believe someone may be in immediate danger — escalate through official safety tools",
          "Only if a friend asks",
        ],
        correctIndex: 2,
        explanation: "Safety escalation is the one legitimate exception, and it goes through Heart2Hear's official tools, not informal channels.",
      },
      {
        id: "cc-2",
        question: "A client's cultural practice is unfamiliar to you. Best approach?",
        options: [
          "Assume it's similar to something you already know",
          "Ask them, respectfully, to help you understand",
          "Avoid the topic completely",
          "Tell them it sounds unusual",
        ],
        correctIndex: 1,
        explanation: "Respectful curiosity beats assumption or avoidance.",
      },
    ],
  },
  {
    id: "crisis-recognition",
    title: "Crisis Recognition & Escalation",
    explanation: [
      "Some conversations involve real danger: suicidal thoughts, self-harm, or threats of harm to someone else. Recognizing these signs matters more than responding 'perfectly'.",
      "Your job in a crisis is not to be a crisis counselor — it's to stay calm, take it seriously, and use Heart2Hear's safety tools to escalate immediately. The platform's safety system also independently detects these signs.",
      "Never promise secrecy about a safety concern, and never try to 'talk someone down' on your own as a substitute for real crisis support.",
    ],
    examples: [
      "Client: \"I don't want to be here anymore.\" — This is a signal to take seriously and escalate, not something to brush past.",
      "Use the in-chat Safety Concern button rather than continuing the conversation as if it were a normal session.",
    ],
    scenario: {
      prompt: "A client says something that sounds like they may be considering self-harm.",
      question: "What should you do first?",
      options: [
        "Keep chatting normally and hope it passes",
        "Try to fully resolve it yourself using your own advice",
        "Use the platform's Safety Concern tool to escalate right away",
        "End the conversation immediately without a word",
      ],
      correctIndex: 2,
      explanation: "Escalating through the platform's safety tools connects them with real support — this is always the correct first move.",
    },
    quiz: [
      {
        id: "cr-1",
        question: "What is a helper's role when a client shows signs of crisis?",
        options: [
          "Act as their crisis counselor",
          "Ignore it if they seem to be joking",
          "Take it seriously and escalate through Heart2Hear's safety tools",
          "Refer them to a specific medication",
        ],
        correctIndex: 2,
        explanation: "Helpers escalate; they don't attempt to provide crisis counseling themselves.",
      },
      {
        id: "cr-2",
        question: "True or false: if a crisis signal might just be the client venting, it's safer to escalate anyway.",
        options: ["True — always err toward escalation when there's meaningful risk", "False — only escalate if you're completely certain"],
        correctIndex: 0,
        explanation: "The platform's policy is to err toward escalation whenever there's meaningful risk, rather than requiring certainty.",
      },
    ],
  },
];

/** Scenario-based final assessment (spec §13). Passing score lives in Firestore platformSettings, not hard-coded, but 80 is the seed default. */
export const FINAL_TEST: QuizQuestion[] = [
  {
    id: "ft-1",
    question: "A client says: \"I feel terrible and I think I need antidepressants. Which medicine should I take?\" What do you do?",
    options: [
      "Suggest a well-known antidepressant",
      "Say you can't recommend medication, respond empathetically, and encourage a licensed professional",
      "Tell them medication never helps",
      "Ask a family member who takes medication what they use",
    ],
    correctIndex: 1,
    explanation: "This is the platform's flagship example: never recommend medication, always redirect to a professional.",
  },
  {
    id: "ft-2",
    question: "A client mentions thoughts of self-harm. Your first action is to:",
    options: [
      "Continue the conversation as normal",
      "Escalate immediately using the platform's safety tools",
      "Tell them to calm down",
      "End the chat without saying anything",
    ],
    correctIndex: 1,
    explanation: "Immediate escalation through official safety tools is always correct.",
  },
  {
    id: "ft-3",
    question: "A client asks if they have depression. Correct response?",
    options: [
      "\"Based on what you've said, yes, you have depression.\"",
      "\"I can't diagnose that, but a licensed professional can help you understand what you're feeling.\"",
      "\"No, you're just stressed.\"",
      "\"Probably, most people your age do.\"",
    ],
    correctIndex: 1,
    explanation: "Never confirm or deny a diagnosis — redirect to a professional.",
  },
  {
    id: "ft-4",
    question: "A client wants to keep chatting outside the Heart2Hear platform. Best response?",
    options: [
      "Share your personal contact info",
      "Agree if they seem trustworthy",
      "Explain that staying on-platform keeps things safe for both of you",
      "Block them immediately",
    ],
    correctIndex: 2,
    explanation: "Staying on-platform is a hard boundary that protects both parties.",
  },
  {
    id: "ft-5",
    question: "What best describes a helper's role on Heart2Hear?",
    options: [
      "A licensed therapist providing treatment",
      "A trained listener offering non-clinical emotional support",
      "A medical advisor",
      "A crisis counselor",
    ],
    correctIndex: 1,
    explanation: "This is the core distinction the entire training reinforces.",
  },
  {
    id: "ft-6",
    question: "A client shares something you personally disagree with, culturally or morally. You should:",
    options: [
      "Share your own opinion strongly",
      "Stay neutral, respectful, and focused on their feelings",
      "End the conversation",
      "Try to change their mind",
    ],
    correctIndex: 1,
    explanation: "Helpers support without judgment, regardless of personal views.",
  },
  {
    id: "ft-7",
    question: "A client seems to be improving and says they don't need to talk to anyone else. You should:",
    options: [
      "Discourage them from ever seeking other support, so they keep talking to you",
      "Encourage healthy support systems and professional help where appropriate, without creating dependency",
      "Agree that talking to you alone is enough forever",
      "End the relationship abruptly",
    ],
    correctIndex: 1,
    explanation: "Helpers must never encourage dependency — the platform explicitly prohibits this incentive.",
  },
  {
    id: "ft-8",
    question: "Confidentiality can be broken when:",
    options: [
      "You think the story is interesting enough to share",
      "A friend asks what happened in your last chat",
      "You believe someone may be in immediate danger",
      "Never, under any circumstance",
    ],
    correctIndex: 2,
    explanation: "Immediate danger is the sole legitimate exception, handled via official escalation.",
  },
];
