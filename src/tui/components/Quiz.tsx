import React, { useState } from 'react';

export interface QuizQuestion {
    text: string;
    options: string[];
    correctIndex: number;
}

export interface QuizProps {
    questions: QuizQuestion[];
    onComplete: (score: number) => void;
}

export function QuizComponent({ questions, onComplete }: QuizProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);

    const question = questions[currentIndex];

    const handleAnswer = (index: number) => {
        let newScore = score;
        if (index === question.correctIndex) {
            newScore += 1;
            setScore(newScore);
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex >= questions.length) {
            onComplete(newScore);
        } else {
            setCurrentIndex(nextIndex);
        }
    };

    if (currentIndex >= questions.length) {
        return (
            <box border padding={1}>
                <text>
                    Quiz complete! Score: <span fg="green">{score}/{questions.length}</span>
                </text>
            </box>
        );
    }

    return (
        <box border padding={1} flexDirection="column" gap={1}>
            <text><strong>Question {currentIndex + 1} of {questions.length}</strong></text>
            <text>{question.text}</text>
            
            <box flexDirection="column" gap={1} marginTop={1}>
                {question.options.map((option, index) => (
                    <box 
                        key={index}
                        onMouseDown={() => handleAnswer(index)}
                        paddingLeft={2}
                    >
                        <text>
                            <span fg="cyan">[{index + 1}]</span> {option}
                        </text>
                    </box>
                ))}
            </box>
        </box>
    );
}
