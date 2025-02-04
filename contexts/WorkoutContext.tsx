const addWorkout = async (workout: Workout) => {
  try {
    console.log('Adding workout with data:', workout);
    const token = await user?.getIdToken();
    const response = await fetch('/api/workouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(workout),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server responded with error:', errorData);
      throw new Error('Failed to add workout');
    }

    const result = await response.json();
    console.log('Server response:', result);
    
    await fetchWorkouts(); // Znovu načteme všechny workouty
  } catch (error) {
    console.error('Error adding workout:', error);
    throw error; // Přeposíláme error dál
  }
};
