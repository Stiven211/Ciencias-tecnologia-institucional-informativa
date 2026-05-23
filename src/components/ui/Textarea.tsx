interface TextareaProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
}

export const Textarea = ({ 
  value, 
  onChange, 
  placeholder = '', 
  rows = 4, 
  disabled = false 
}: TextareaProps) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-navy-50 disabled:cursor-not-allowed"
    />
  )
}