import React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

const Loginpage = () => {
  const [count, setCount] = useState(0);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();

    const onSubmit = async (data) => {
    try {
      const res = await fetch('http://localhost:3500/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (res.ok) {
        localStorage.setItem('token', result.token); // store token for auth
        localStorage.setItem('email', result.email); // dynamic user info
        navigate('/landing'); // redirect to landing page
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error(err);
      alert('Server error!');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5'
    }}>
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        style={{
          backgroundColor: '#fff',
          padding: '30px 40px',
          borderRadius: '12px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
          width: '350px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>

        <label>Email</label>
        <input 
          type='text' 
          {...register("email", { required: "email is empty" })} 
          style={{ padding: '10px', margin: '5px 0 15px 0', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        {errors.email && <p style={{ color: "red", marginTop: '-10px', marginBottom: '10px' }}>{errors.email.message}</p>}

        <label>Password</label>
        <input 
          type='password' 
          {...register("password", { required: "password is empty" })} 
          style={{ padding: '10px', margin: '5px 0 20px 0', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        {errors.password && <p style={{ color: "red", marginTop: '-10px', marginBottom: '10px' }}>{errors.password.message}</p>}

        <button 
          type='submit' 
          disabled={isSubmitting} 
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#4CAF50',
            color: '#fff',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? "Submitting..." : "LOGIN"}
        </button>
      </form>
    </div>
  );
}

export default Loginpage;