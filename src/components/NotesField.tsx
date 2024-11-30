import React from 'react';

type NotesFieldProps = {
  fieldId: string;
  instanceIndex: number;
  value: string;
  onChange: (value: string) => void;
};

const NotesField: React.FC<NotesFieldProps> = ({
  fieldId,
  instanceIndex,
  value,
  onChange
}) => {
  return (
    <div className="mt-2">
      <textarea
        className="w-full p-2 border rounded"
        placeholder="Additional notes..."
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default NotesField; 