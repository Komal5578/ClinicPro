const SlotPicker = ({ slots, selectedSlot, onSelect }) => {
  const openSlots = slots.filter(s => s.status === 'OPEN');

  if (openSlots.length === 0) {
    return (
      <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }}>
        No open slots available today
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {openSlots.map(slot => (
        <button
          key={slot.slot_id}
          type="button"
          onClick={() => onSelect(slot.slot_id)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: `2px solid ${selectedSlot === slot.slot_id ? 'var(--primary)' : 'var(--border)'}`,
            background: selectedSlot === slot.slot_id ? 'var(--primary-light)' : 'white',
            color: selectedSlot === slot.slot_id ? 'var(--primary)' : 'var(--text)',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'monospace',
            transition: 'all 0.15s'
          }}
        >
          {slot.slot_start_time?.slice(0, 5)}
        </button>
      ))}
    </div>
  );
};

export default SlotPicker;