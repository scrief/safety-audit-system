import React from 'react';

type QuestionTextFieldProps = {
  fieldId: string;
  instanceIndex: number;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

const QuestionTextField: React.FC<QuestionTextFieldProps> = ({
  fieldId,
  instanceIndex,
  value,
  onChange,
  required
}) => {
  return (
    <div>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border rounded-md min-h-[100px]"
        required={required}
        placeholder="Enter text here..."
      />
    </div>
  );
};

export default QuestionTextField; 