export interface Question {
  question_id: string;
  question_type: "TF" | "MC" | "MR" | "TI" | "MG" | "SEQ" | "NUMG";
  image: string;
  video: string;
  audio: string;
  question_paragraph: string;
  question_text: string;
  answer_1: string;
  answer_2: string;
  answer_3: string;
  answer_4: string;
  correct_feedback: string;
  incorrect_feedback: string;
  points: string;
}

export interface Student {
  student_id: string;
  absen: string;
  nis: string;
  name: string;
  class: string;
}

export interface AnswerRecord {
  question_id: string;
  response: string | string[];
  correct: boolean;
  points: string;
}

export interface ScoreRecord {
  student_id: string;
  answers: AnswerRecord[];
  total_score: string;
  duration: string;
  status: string;
  exam_id?: string;
  exam_name?: string;
  submitted_at?: string;
}

export interface ExamPackage {
  exam_id: string;
  name: string;
  /** local datetime string: YYYY-MM-DDTHH:mm */
  start_time: string;
  end_time: string;
  duration_minutes: number;
  review_duration: number;
  blocked: boolean;
}
