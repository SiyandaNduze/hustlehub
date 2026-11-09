import { useState } from 'react';
import { fieldErrorMap } from '../api/client';
import { validateGig } from '../utils/validation';
import { ApiErrorAlert } from './Alert';
import Field from './Field';

const empty = { title: '', description: '', category: '', price: '', active: true };
const FIELDS = ['title', 'description', 'category', 'price', 'active'];

export default function GigForm({ categories = [], initial, submitLabel = 'Create gig', onSubmit, onCancel }) {
  const [form, setForm] = useState(initial ? { ...empty, ...initial, price: String(initial.price) } : empty);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError(null);
    const found = validateGig(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Number(form.price),
    };
    if (initial) payload.active = form.active;

    setSubmitting(true);
    try {
      await onSubmit(payload);
      if (!initial) setForm(empty);
    } catch (err) {
      setErrors(fieldErrorMap(err)); // server errors appear next to their field
      setApiError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <ApiErrorAlert error={apiError} shownFields={FIELDS} />

      <Field
        label="Title"
        id="gig-title"
        name="title"
        hint="What will the client get? 3 to 100 characters."
        value={form.title}
        onChange={onChange}
        maxLength={100}
        error={errors.title}
      />
      <Field
        as="textarea"
        label="Description"
        id="gig-description"
        name="description"
        hint={`What's included and what you need from the client. ${form.description.length}/2000`}
        rows={5}
        value={form.description}
        onChange={onChange}
        maxLength={2000}
        error={errors.description}
      />
      <div className="form-row">
        <Field as="select" label="Category" id="gig-category" name="category" value={form.category} onChange={onChange} error={errors.category}>
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Field>
        <Field
          label="Price (ZAR)"
          id="gig-price"
          name="price"
          type="number"
          inputMode="decimal"
          min="1"
          max="100000"
          step="0.01"
          value={form.price}
          onChange={onChange}
          error={errors.price}
        />
      </div>

      {initial && (
        <label className="checkbox">
          <input type="checkbox" name="active" checked={form.active} onChange={onChange} /> Gig is visible to clients
        </label>
      )}

      <div className="row">
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
