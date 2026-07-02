import { useState, useEffect, useRef } from 'react';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability } from '../../api/menu';
import { useToast } from '../../context/ToastContext';
import { AdminSidebar } from './Dashboard';

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts'];
const EMPTY_FORM = { name: '', description: '', price: '', category: 'Breakfast', preparationTime: '10', tags: '', isAvailable: true, image: '' };

function MenuItemModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item ? { ...item, tags: item.tags?.join(', ') || '', price: String(item.price), preparationTime: String(item.preparationTime) } : EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(item?.image || '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef();
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.price || isNaN(form.price) || parseFloat(form.price) < 0) errs.price = 'Enter a valid price';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('category', form.category);
      formData.append('preparationTime', form.preparationTime);
      formData.append('tags', form.tags);
      formData.append('isAvailable', form.isAvailable);
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (form.image) {
        formData.append('image', form.image);
      }

      if (item) {
        await updateMenuItem(item._id, formData);
        toast.success('Menu item updated');
      } else {
        await createMenuItem(formData);
        toast.success('Menu item created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{item ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div
              className="img-preview"
              onClick={() => fileRef.current.click()}
              title="Click to upload image"
              style={{ marginBottom: '1rem', cursor: 'pointer' }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="img-preview-placeholder">
                  <span>Image</span>
                  <p>Click to upload image</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} id="menu-image-upload" />

            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} placeholder="e.g. Masala Dosa" id="menu-item-name" />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea name="description" className="form-control" value={form.description} onChange={handleChange} placeholder="Brief description of the item" id="menu-item-desc" />
              {errors.description && <span className="form-error">{errors.description}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Price (Rs.) *</label>
                <input type="number" name="price" className="form-control" value={form.price} onChange={handleChange} min="0" step="0.5" id="menu-item-price" />
                {errors.price && <span className="form-error">{errors.price}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Prep Time (min)</label>
                <input type="number" name="preparationTime" className="form-control" value={form.preparationTime} onChange={handleChange} min="1" id="menu-item-prep" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-control" value={form.category} onChange={handleChange} id="menu-item-category">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input name="tags" className="form-control" value={form.tags} onChange={handleChange} placeholder="e.g. veg, spicy, popular" id="menu-item-tags" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label className="toggle-switch">
                <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleChange} id="menu-item-available" />
                <span className="toggle-slider" />
              </label>
              <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>Item is available</span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" id="save-menu-item" disabled={saving}>
              {saving ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const toast = useToast();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await getMenuItems({});
      setItems(data);
    } catch {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteMenuItem(id);
      toast.success('Item deleted');
      fetchItems();
    } catch {
      toast.error('Failed to delete item');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await toggleItemAvailability(id);
      toast.info(`Item is now ${data.isAvailable ? 'available' : 'unavailable'}`);
      setItems((prev) => prev.map((i) => i._id === id ? { ...i, isAvailable: data.isAvailable } : i));
    } catch {
      toast.error('Failed to toggle availability');
    }
  };

  const filtered = filterCat === 'All' ? items : items.filter((i) => i.category === filterCat);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h1 style={{ margin: 0 }}>Menu Items</h1>
          <button className="btn btn-primary" id="add-menu-item-btn" onClick={() => setModal({ type: 'add' })}>+ Add Item</button>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {['All', ...CATEGORIES].map((c) => (
            <button key={c} className={`btn btn-sm ${filterCat === c ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterCat(c)} id={`filter-${c.toLowerCase()}`}>{c}</button>
          ))}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Prep</th>
                  <th>Available</th>
                  <th>Orders</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item._id} id={`admin-item-${item._id}`}>
                    <td>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="table-img" />
                      ) : (
                        <div className="table-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', background: 'var(--gray-100)' }}>No Image</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                    </td>
                    <td><span className="badge badge-blue">{item.category}</span></td>
                    <td style={{ fontWeight: 700 }}>Rs. {item.price}</td>
                    <td>{item.preparationTime}m</td>
                    <td>
                      <label className="toggle-switch">
                        <input type="checkbox" checked={item.isAvailable} onChange={() => handleToggle(item._id)} id={`toggle-${item._id}`} />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.totalOrders}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary btn-sm" id={`edit-item-${item._id}`} onClick={() => setModal({ type: 'edit', item })}>Edit</button>
                        <button className="btn btn-danger btn-sm" id={`delete-item-${item._id}`} onClick={() => setDeleteConfirm(item._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No items found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <MenuItemModal
          item={modal.type === 'edit' ? modal.item : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchItems(); }}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h2>Delete Item</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>x</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--gray-600)' }}>This action is permanent and cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" id="confirm-delete" onClick={() => handleDelete(deleteConfirm)} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
