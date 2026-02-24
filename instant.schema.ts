import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    users: i.entity({
      email: i.string().unique().indexed(),
      firstName: i.string(),
      lastName: i.string(),
      linkedin: i.string().optional(),
      location: i.string().optional(),
      currentTitleAndCompany: i.string().optional(),
      priorTitleAndCompany: i.string().optional(),
      schoolAndDegree: i.string().optional(),
      internalNotes: i.string().optional(),
      isAdmin: i.boolean(),
      createdAt: i.string(),
      updatedAt: i.string().optional(),
    }),
    events: i.entity({
      slug: i.string().unique().indexed(),
      title: i.string(),
      description: i.string().optional(),
      date: i.string().optional(),
      endDate: i.string().optional(),
      location: i.string().optional(),
      status: i.string(), // draft | published | closed | archived
      eventAttendeeSelectionParams: i.string().optional(),
      createdAt: i.string(),
      updatedAt: i.string().optional(),
    }),
    eventQuestions: i.entity({
      questionText: i.string(),
      required: i.boolean(),
      order: i.number(),
    }),
    applications: i.entity({
      status: i.string(), // applied | confirmed | rejected
      internalNotes: i.string().optional(),
      createdAt: i.string(),
      updatedAt: i.string().optional(),
      reviewedAt: i.string().optional(),
    }),
    applicationAnswers: i.entity({
      answerText: i.string(),
    }),
    eventCriteria: i.entity({
      text: i.string(),
    }),
  },
  links: {
    eventQuestionEvent: {
      forward: { on: "eventQuestions", has: "one", label: "event" },
      reverse: { on: "events", has: "many", label: "questions" },
    },
    applicationUser: {
      forward: { on: "applications", has: "one", label: "user" },
      reverse: { on: "users", has: "many", label: "applications" },
    },
    applicationEvent: {
      forward: { on: "applications", has: "one", label: "event" },
      reverse: { on: "events", has: "many", label: "applications" },
    },
    answerApplication: {
      forward: { on: "applicationAnswers", has: "one", label: "application" },
      reverse: { on: "applications", has: "many", label: "answers" },
    },
    answerQuestion: {
      forward: { on: "applicationAnswers", has: "one", label: "question" },
      reverse: { on: "eventQuestions", has: "many", label: "answers" },
    },
    eventCriteriaEvent: {
      forward: { on: "eventCriteria", has: "one", label: "event" },
      reverse: { on: "events", has: "many", label: "criteria" },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
