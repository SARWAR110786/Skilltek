"use client";

import { useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui";

const OPTIONS = ["A", "B", "C", "D"] as const;
type OptionKey = (typeof OPTIONS)[number];

export function QuizQuestionFields({
  defaultText = "",
  defaultOptionA = "",
  defaultOptionB = "",
  defaultOptionC = "",
  defaultOptionD = "",
  defaultCorrect = "A",
}: {
  defaultText?: string;
  defaultOptionA?: string;
  defaultOptionB?: string;
  defaultOptionC?: string;
  defaultOptionD?: string;
  defaultCorrect?: string;
}) {
  const [text, setText] = useState(defaultText);
  const [options, setOptions] = useState({
    A: defaultOptionA,
    B: defaultOptionB,
    C: defaultOptionC,
    D: defaultOptionD,
  });
  const [correct, setCorrect] = useState<OptionKey>(
    (OPTIONS as readonly string[]).includes(defaultCorrect)
      ? (defaultCorrect as OptionKey)
      : "A",
  );

  function setOption(key: OptionKey, value: string) {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="contents">
      <div className="md:col-span-2">
        <Field label="Question" required>
          <Textarea
            name="text"
            rows={2}
            value={text}
            required
            placeholder="Type the question..."
            onChange={(e) => setText(e.target.value)}
          />
        </Field>
      </div>

      {OPTIONS.map((key) => (
        <Field key={key} label={`Option ${key}`} required>
          <Input
            name={`option${key}`}
            value={options[key]}
            required
            onChange={(e) => setOption(key, e.target.value)}
            placeholder={`Option ${key}`}
          />
        </Field>
      ))}

      <Field label="Correct option">
        <Select
          name="correctOption"
          value={correct}
          onChange={(e) => setCorrect(e.target.value as OptionKey)}
        >
          {OPTIONS.map((o) => (
            <option key={o} value={o}>
              Option {o}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
