import { PraisePost, Survey, SurveyResponse, Milestone } from '@/types/recognition';

export const mockPraisePosts: PraisePost[] = [
  {
    id: 'praise-1',
    fromStaffId: 'staff-2',
    toStaffId: 'staff-1',
    category: 'going_above',
    message: 'Mark stayed late last Friday to help set up for the parent orientation event. The decorations looked amazing and parents were so impressed! Thank you for always going above and beyond! 🌟',
    badges: ['star-performer', 'team-player'],
    likes: ['staff-3', 'staff-4'],
    comments: [
      { id: 'c-1', staffId: 'staff-3', content: 'Well deserved! Mark is always so helpful!', createdAt: '2025-01-15T10:30:00Z' },
    ],
    createdAt: '2025-01-15T09:00:00Z',
  },
  {
    id: 'praise-2',
    fromStaffId: 'staff-1',
    toStaffId: 'staff-2',
    category: 'leadership',
    message: 'Sarah\'s new mentoring program has been a game-changer for our onboarding process. The new team members feel so much more supported and confident. Thank you for your leadership!',
    badges: ['innovator'],
    likes: ['staff-1', 'staff-3', 'staff-4'],
    comments: [],
    createdAt: '2025-01-14T14:00:00Z',
  },
  {
    id: 'praise-3',
    fromStaffId: 'staff-3',
    toStaffId: 'staff-4',
    category: 'teamwork',
    message: 'Emily jumped in to cover when I had an emergency last week. She handled everything perfectly and the children didn\'t even notice the change. True team spirit! 🤝',
    badges: ['reliable'],
    likes: ['staff-1', 'staff-2'],
    comments: [
      { id: 'c-2', staffId: 'staff-2', content: 'Emily is a wonderful addition to our team!', createdAt: '2025-01-13T11:00:00Z' },
    ],
    createdAt: '2025-01-13T09:30:00Z',
  },
  {
    id: 'praise-4',
    fromStaffId: 'staff-2',
    toStaffId: 'staff-3',
    category: 'innovation',
    message: 'James came up with a brilliant idea for our outdoor play area. The new sensory garden is loved by all the children! 💡',
    badges: ['creative-thinker'],
    likes: ['staff-1'],
    comments: [],
    createdAt: '2025-01-10T15:00:00Z',
  },
];

export const mockSurveys: Survey[] = [
  {
    id: 'survey-1',
    title: 'Q1 2025 Employee Engagement Survey',
    description: 'Help us understand how you\'re feeling about work and what we can improve.',
    status: 'active',
    anonymous: true,
    questions: [
      { id: 'q-1', type: 'rating', text: 'How satisfied are you with your work-life balance?', required: true },
      { id: 'q-2', type: 'rating', text: 'How well do you feel your contributions are recognized?', required: true },
      { id: 'q-3', type: 'rating', text: 'How likely are you to recommend this workplace to a friend?', required: true },
      { id: 'q-4', type: 'multiple_choice', text: 'What would most improve your day-to-day work?', required: false, options: ['Better communication', 'More training', 'Better tools/resources', 'More flexibility', 'Other'] },
      { id: 'q-5', type: 'text', text: 'What\'s one thing we could do to make this a better place to work?', required: false },
    ],
    startDate: '2025-01-15',
    endDate: '2025-01-31',
    responseCount: 3,
    targetAudience: 'all',
    createdBy: 'staff-1',
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z',
  },
  {
    id: 'survey-2',
    title: 'Training Needs Assessment',
    description: 'Tell us what skills you\'d like to develop this year.',
    status: 'draft',
    anonymous: false,
    questions: [
      { id: 'q-6', type: 'multiple_choice', text: 'Which area would you like more training in?', required: true, options: ['Leadership', 'Technical skills', 'Communication', 'Child development', 'Safety & compliance'] },
      { id: 'q-7', type: 'yes_no', text: 'Would you be interested in mentoring opportunities?', required: true },
      { id: 'q-8', type: 'text', text: 'Any specific courses or certifications you\'d like to pursue?', required: false },
    ],
    startDate: '2025-02-01',
    endDate: '2025-02-14',
    responseCount: 0,
    targetAudience: 'all',
    createdBy: 'staff-2',
    createdAt: '2025-01-14T09:00:00Z',
    updatedAt: '2025-01-14T09:00:00Z',
  },
];

export const mockMilestones: Milestone[] = [
  { id: 'ms-1', staffId: 'staff-1', type: 'anniversary', title: '1 Year Anniversary', date: '2025-01-18', celebrated: false },
  { id: 'ms-2', staffId: 'staff-2', type: 'birthday', title: 'Birthday', date: '2025-01-25', celebrated: false },
  { id: 'ms-3', staffId: 'staff-3', type: 'certification', title: 'First Aid Certification', date: '2025-02-10', celebrated: false },
  { id: 'ms-4', staffId: 'staff-4', type: 'promotion', title: 'Promoted to Educator', date: '2025-02-01', celebrated: false },
];

export const praiseWallBadges = [
  { id: 'star-performer', label: 'Star Performer', emoji: '⭐' },
  { id: 'team-player', label: 'Team Player', emoji: '🤝' },
  { id: 'innovator', label: 'Innovator', emoji: '💡' },
  { id: 'reliable', label: 'Reliable', emoji: '🎯' },
  { id: 'creative-thinker', label: 'Creative Thinker', emoji: '🎨' },
  { id: 'mentor', label: 'Mentor', emoji: '🎓' },
  { id: 'customer-hero', label: 'Customer Hero', emoji: '💖' },
  { id: 'problem-solver', label: 'Problem Solver', emoji: '🔧' },
];
