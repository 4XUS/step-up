import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export function useFirestoreTasks() {
  const [tasks, setTasks] = useState([]);
  const [doneTasks, setDoneTasks] = useState([]);
  const [quadrants, setQuadrants] = useState({
    do: [],
    plan: [],
    delegate: [],
    delete: []
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'tasks'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const newTasks = [];
        const newDoneTasks = [];
        const newQuadrants = {
          do: [],
          plan: [],
          delegate: [],
          delete: []
        };

        let taskNumber = 1;

        snapshot.forEach((doc) => {
          const taskData = doc.data();
          const task = {
            id: doc.id,
            content: taskData.text, 
            number: taskNumber++,
            ...taskData
          };

          if (task.done) {
            newDoneTasks.push(task);
          } else if (task.quadrant) {
            newQuadrants[task.quadrant].push(task);
          } else {
            newTasks.push(task);
          }
        });

        setTasks(newTasks);
        setDoneTasks(newDoneTasks);
        setQuadrants(newQuadrants);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const addTask = async (taskText) => {
    if (!currentUser) return;

    const taskCount = tasks.length + Object.values(quadrants).flat().length;

    await addDoc(collection(db, 'tasks'), {
      text: taskText,
      content: taskText, 
      done: false,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      number: taskCount + 1
    });
  };

  const updateTask = async (taskId, updates) => {
    if (!currentUser) return;

    const taskRef = doc(db, 'tasks', taskId);
    if (updates.text) {
      updates.content = updates.text;
    }
    await updateDoc(taskRef, updates);
  };

  const deleteTask = async (taskId) => {
    if (!currentUser) return;

    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
  };

  const moveTaskToQuadrant = async (taskId, quadrant) => {
    await updateTask(taskId, { quadrant });
  };

  const markTaskAsDone = async (taskId) => {
    await updateTask(taskId, { 
      done: true,
      completedAt: serverTimestamp()
    });
  };

  return {
    tasks,
    doneTasks,
    quadrants,
    addTask,
    updateTask,
    deleteTask,
    moveTaskToQuadrant,
    markTaskAsDone
  };
}
