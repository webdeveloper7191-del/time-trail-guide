import { ScreeningQuestion } from '@/types/recruitment';

export const predefinedQuestions: Omit<ScreeningQuestion, 'id'>[] = [
  {
    text: "Do you have the right to work in Australia?",
    type: "yes_no",
    isRequired: true,
    preferredAnswer: true,
  },
  {
    text: "How many years of experience do you have in this field?",
    type: "number",
    isRequired: true,
  },
  {
    text: "Do you hold a current Australian driver's licence?",
    type: "yes_no",
    isRequired: false,
    preferredAnswer: true,
  },
  {
    text: "Do you have a current Working With Children Check?",
    type: "yes_no",
    isRequired: false,
    preferredAnswer: true,
  },
  {
    text: "Do you have a current National Police Check?",
    type: "yes_no",
    isRequired: false,
    preferredAnswer: true,
  },
  {
    text: "What is your availability to start?",
    type: "single_choice",
    options: ["Immediately", "1 week", "2 weeks", "4 weeks", "More than 4 weeks"],
    isRequired: true,
  },
  {
    text: "What is your expected annual salary/hourly rate?",
    type: "number",
    isRequired: false,
  },
  {
    text: "Are you willing to relocate for this position?",
    type: "yes_no",
    isRequired: false,
  },
  {
    text: "Do you hold a current First Aid certificate?",
    type: "yes_no",
    isRequired: false,
    preferredAnswer: true,
  },
  {
    text: "Do you hold the relevant qualifications for this role?",
    type: "yes_no",
    isRequired: true,
    preferredAnswer: true,
  }
];
