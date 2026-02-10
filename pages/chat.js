import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Chat = () => {
  const [keyword, setKeyword] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [editId, setEditId] = useState(null);

  const fetchKeywords = async () => {
    const res = await axios.get('http://localhost:5000/api/keywords');
    setKeywords(res.data);
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  const handleAdd = async () => {
    if (!keyword) return;
    if (editId) {
      await axios.put(`http://localhost:5000/api/keywords/${editId}`, { keyword });
      setEditId(null);
    } else {
      await axios.post('http://localhost:5000/api/keywords', { keyword });
    }
    setKeyword('');
    fetchKeywords();
  };

  const handleEdit = (item) => {
    setKeyword(item.keyword);
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/api/keywords/${id}`);
    fetchKeywords();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h2>Keyword Manager</h2>
      <div style={{ display: 'flex', marginBottom: '10px' }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter keyword"
          style={{ flex: 1, padding: '8px' }}
        />
        <button onClick={handleAdd} style={{ padding: '8px 12px', marginLeft: '10px' }}>
          {editId ? 'Update' : 'Add'}
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {keywords.map((item) => (
          <li key={item.id} style={{ marginBottom: '10px' }}>
            <span style={{ marginRight: '10px' }}>{item.keyword}</span>
            <button onClick={() => handleEdit(item)} style={{ marginRight: '5px' }}>Edit</button>
            <button onClick={() => handleDelete(item.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Chat;
