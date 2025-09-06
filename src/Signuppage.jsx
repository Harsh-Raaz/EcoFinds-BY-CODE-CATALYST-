import React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

const Signuppage = () => {
  const [count, setCount] = useState(0);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  async function onSubmit(data) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(data);
  }

  return (
    <div style={{
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#f0f2f5'
}}>
      <form onSubmit={handleSubmit(onSubmit)} // ← yeh line missing thi
  style={{
    backgroundColor: '#fff',
    padding: '30px 40px',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
    width: '350px',
    display: 'flex',
    flexDirection: 'column'
  }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Signup</h2>

        <label>Name</label>
        <input 
          type='text' 
          {...register("name", {
            required: "name is empty",
            minLength: { value: 3, message: "min length should be 3" },
            maxLength: { value: 10, message: "max length should be 10" },
            pattern: { value: /^[a-z]+$/i, message: "write valid name" }
          })} 
          style={{ padding: '10px', margin: '5px 0 15px 0', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        {errors.name && <p style={{ color: "red", marginTop: '-10px', marginBottom: '10px' }}>{errors.name.message}</p>}

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
          style={{ padding: '10px', margin: '5px 0 15px 0', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        {errors.password && <p style={{ color: "red", marginTop: '-10px', marginBottom: '10px' }}>{errors.password.message}</p>}

        <label>Confirm Password</label>
        <input 
          type='password' 
          {...register("confirmpassword", { required: "confirm password is empty" })} 
          style={{ padding: '10px', margin: '5px 0 20px 0', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        {errors.confirmpassword && <p style={{ color: "red", marginTop: '-10px', marginBottom: '10px' }}>{errors.confirmpassword.message}</p>}

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
          {isSubmitting ? "Submitting..." : "Signup"}
        </button>
      </form>
    </div>
  );
}

export default Signuppage;