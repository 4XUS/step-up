import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ToolLayout from '../components/ToolLayout';
import { useFirestoreTasks } from '../hooks/useFirestoreTasks';
import '../styles/Eisenhower.css';

const QUADRANT_LABELS = {
  do: 'DO',
  plan: 'PLAN',
  delegate: 'DELEGATE',
  delete: 'DELETE'
};

const EISENHOWER = () => {
  const {
    tasks,
    doneTasks,
    quadrants,
    addTask,
    updateTask,
    deleteTask,
    moveTaskToQuadrant,
    markTaskAsDone
  } = useFirestoreTasks();

  const [newTask, setNewTask] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDone, setShowDone] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const popupRef = useRef(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setSelectedTask(null);
        setPopupVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTask(newTask);
      setNewTask('');
    }
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId);
    setSelectedTask(null);
    setPopupVisible(false);
  };

  const handleMarkDone = async () => {
    if (selectedTask) {
      await markTaskAsDone(selectedTask.id);
      setPopupVisible(false);
      setSelectedTask(null);
    }
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
    setSelectedTask(null);
  };

  const handleTaskClick = useCallback((e, task) => {
    // Prevent popup from opening during drag
    if (e.defaultPrevented) return;

    setSelectedTask(task);
    setPopupVisible(true);
  }, []);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside any droppable
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Reordering within the task list — do nothing
    if (source.droppableId === 'tasksList' && destination.droppableId === 'tasksList') {
      return;
    }

    try {
      if (destination.droppableId !== 'tasksList') {
        // Moving to a quadrant (from task list OR from another quadrant)
        await moveTaskToQuadrant(draggableId, destination.droppableId);
      } else if (destination.droppableId === 'tasksList') {
        // Moving back to the task list from a quadrant
        await updateTask(draggableId, { quadrant: null });
      }
    } catch (error) {
      console.error('Error during drag and drop:', error);
    }
  };

  const clearAllTasks = async () => {
    // Mark all active tasks as done
    const allActive = [...tasks, ...Object.values(quadrants).flat()];
    await Promise.all(allActive.map(task => markTaskAsDone(task.id)));
  };

  // Build safe drag style — avoids "undefined scale()" CSS bug
  const buildDragStyle = (draggableStyle, isDragging, scale = 1.05) => {
    const style = { ...draggableStyle };
    if (isDragging) {
      style.opacity = 0.92;
      style.zIndex = 9999;
      // Safely append scale only if transform exists
      if (style.transform) {
        style.transform = `${style.transform} scale(${scale})`;
      }
    }
    return style;
  };

  return (
    <ToolLayout>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="eisenhower-container">
          {/* === MATRIX === */}
          <div className="matrix-container">
            {/* Axe IMPORTANT (vertical, bas→haut) */}
            <div className="axis axis-vertical">
              <span className="axis-end axis-plus">+</span>
              <div className="axis-line"></div>
              <span className="axis-end axis-minus">−</span>
              <span className="axis-name axis-name-vertical">IMPORTANT</span>
            </div>
            {/* Axe URGENT (horizontal, droite→gauche) */}
            <div className="axis axis-horizontal">
              <span className="axis-end axis-plus">+</span>
              <div className="axis-line"></div>
              <span className="axis-end axis-minus">−</span>
              <span className="axis-name axis-name-horizontal">URGENT</span>
            </div>
            <div className="matrix">
              {Object.entries(quadrants).map(([quadrantId, quadrantTasks]) => (
                <div key={quadrantId} className={`quadrant ${quadrantId}`}>
                  <h3>{QUADRANT_LABELS[quadrantId]}</h3>
                  <Droppable droppableId={quadrantId} direction="horizontal">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`quadrant-drop-zone ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
                      >
                        {quadrantTasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`task-bubble ${snapshot.isDragging ? 'is-dragging' : ''}`}
                                onClick={(e) => handleTaskClick(e, task)}
                                style={buildDragStyle(provided.draggableProps.style, snapshot.isDragging, 1.15)}
                              >
                                {task.number}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </div>

          {/* === TASK LIST === */}
          <div className="task-list">
            <form onSubmit={handleAddTask} className="add-task-form">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a new task..."
              />
              <button type="submit">Add</button>
            </form>

            <div className="tabs">
              <button
                className={`tab ${!showDone ? 'active' : ''}`}
                onClick={() => setShowDone(false)}
              >
                Active
              </button>
              <button
                className={`tab ${showDone ? 'active' : ''}`}
                onClick={() => setShowDone(true)}
              >
                Done
              </button>
              {!showDone && tasks.length > 0 && (
                <button
                  className="clear-button"
                  onClick={clearAllTasks}
                  title="Clear all active tasks"
                >
                  <span className="trash-icon">🗑️</span>
                  CLEAR
                </button>
              )}
            </div>

            <div className="task-list-items">
              {!showDone ? (
                <Droppable droppableId="tasksList">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`tasks-container ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
                    >
                      {tasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`task-item ${snapshot.isDragging ? 'is-dragging' : ''}`}
                              onClick={(e) => handleTaskClick(e, task)}
                              style={buildDragStyle(provided.draggableProps.style, snapshot.isDragging)}
                            >
                              <div className="task-number">{task.number}</div>
                              <div className="task-content">{task.content}</div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ) : (
                <div className="done-tasks-list">
                  {doneTasks.length === 0 && (
                    <p className="empty-state">No completed tasks yet.</p>
                  )}
                  {doneTasks.map(task => (
                    <div key={task.id} className="task-item done">
                      <div className="task-number done">{task.number}</div>
                      <span className="task-content">{task.content}</span>
                      <span className="completed-at">
                        {task.completedAt ? new Date(task.completedAt.seconds ? task.completedAt.seconds * 1000 : task.completedAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DragDropContext>

      {/* === POPUP === */}
      {popupVisible && selectedTask && (
        <div className="task-popup-overlay" onClick={handleClosePopup}>
          <div
            ref={popupRef}
            className="task-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="task-popup-content">
              <div className="task-popup-number">{selectedTask.number}</div>
              <h4>{selectedTask.content}</h4>
              {selectedTask.quadrant && (
                <span className={`task-popup-quadrant ${selectedTask.quadrant}`}>
                  {QUADRANT_LABELS[selectedTask.quadrant]}
                </span>
              )}
              <div className="button-container">
                <button onClick={handleMarkDone} className="mark-done" title="Mark as done">
                  ✔️
                </button>
                <button onClick={() => handleDeleteTask(selectedTask.id)} className="delete-btn" title="Delete task">
                  🗑️
                </button>
                <button onClick={handleClosePopup} className="close-popup" title="Close">
                  ✖
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default EISENHOWER;
