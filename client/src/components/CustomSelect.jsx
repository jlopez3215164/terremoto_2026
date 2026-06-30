import Select from 'react-select';

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    background: 'rgba(15, 23, 42, 0.6)',
    border: state.isFocused ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
    padding: '2px',
    color: 'white',
    cursor: 'pointer',
    minHeight: '44px',
  }),
  menu: (provided) => ({
    ...provided,
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    zIndex: 10000,
  }),
  option: (provided, state) => ({
    ...provided,
    background: state.isFocused ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
    color: state.isSelected ? '#3b82f6' : 'white',
    cursor: 'pointer',
    padding: '10px 15px',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'white',
  }),
  input: (provided) => ({
    ...provided,
    color: 'white',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#64748b',
  }),
  menuPortal: base => ({ ...base, zIndex: 10000 })
};

export default function CustomSelect({ options, value, onChange, placeholder, isSearchable = true, ...props }) {
  const selectedOption = options.find(opt => opt.value === value) || null;

  const handleChange = (selected) => {
    if (onChange) {
      onChange({ target: { value: selected ? selected.value : '' } });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', color: '#1e293b' }}>
      <Select
        styles={customStyles}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder || 'Seleccionar...'}
        isSearchable={isSearchable}
        menuPortalTarget={document.body}
        {...props}
      />
    </div>
  );
}
