export interface QuizQuestion {
    text: string;
    options: string[];
    correctIndex: number;
}

export class QuizComponent {
    private questions: QuizQuestion[];
    private currentQuestionIndex: number = 0;
    score: number = 0;

    constructor(questions: QuizQuestion[]) {
        this.questions = questions;
    }

    get isComplete(): boolean {
        return this.currentQuestionIndex >= this.questions.length;
    }

    answer(questionIndex: number, selectedOptionIndex: number): void {
        if (questionIndex >= this.questions.length) return;

        const question = this.questions[questionIndex];
        if (selectedOptionIndex === question.correctIndex) {
            this.score += 1;
        }

        this.currentQuestionIndex += 1;
    }
}
