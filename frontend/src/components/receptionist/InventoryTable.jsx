const InventoryTable = ({ items, onUpdateStock }) => {
  if (!items || items.length === 0) {
    return <div className="empty-state"><p>No inventory items found</p></div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Threshold</th>
            <th>Unit</th>
            <th>Status</th>
            {onUpdateStock && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const isLow = item.quantity <= item.threshold_quantity;
            const isEmpty = item.quantity === 0;
            return (
              <tr key={item.item_id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{item.item_name}</div>
                </td>
                <td>
                  <span style={{
                    fontWeight: 700,
                    color: isEmpty ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)',
                    fontSize: 16
                  }}>
                    {item.quantity}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{item.threshold_quantity}</td>
                <td style={{ color: 'var(--text-muted)' }}>{item.unit}</td>
                <td>
                  {isEmpty ? (
                    <span className="badge badge-danger">EMPTY</span>
                  ) : isLow ? (
                    <span className="badge badge-warning">LOW</span>
                  ) : (
                    <span className="badge badge-success">OK</span>
                  )}
                </td>
                {onUpdateStock && (
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        const qty = prompt(`Update quantity for ${item.item_name}\nCurrent: ${item.quantity} ${item.unit}`);
                        if (qty !== null && !isNaN(qty) && qty !== '') {
                          onUpdateStock(item.item_id, parseInt(qty));
                        }
                      }}
                    >
                      Update
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;