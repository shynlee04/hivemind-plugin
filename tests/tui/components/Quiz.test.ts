import { test } from 'node:test';
import * as assert from 'node:assert';
import { QuizComponent } from '../../../src/tui/components/Quiz.js';

test('Quiz Component', async (t) => {
    await t.test('should initialize with questions and handle answers', () => {
        const quiz = new QuizComponent([
            { text: 'What is 2+2?', options: ['3', '4'], correctIndex: 1 }
        ]);
        assert.strictEqual(quiz.isComplete, false);
        quiz.answer(0, 1);
        assert.strictEqual(quiz.isComplete, true);
        assert.strictEqual(quiz.score, 1);
    });
});
