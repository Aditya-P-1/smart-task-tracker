const mongoose = require('mongoose');

const TASK_TITLE_MAX_LENGTH = 140;
const TASK_DESCRIPTION_MAX_LENGTH = 2000;

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: TASK_TITLE_MAX_LENGTH,
      minlength: 1,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: TASK_DESCRIPTION_MAX_LENGTH,
      trim: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

taskSchema.index({ userId: 1, completed: 1, dueDate: 1, createdAt: -1 });

function toTaskResponseObject(task) {
  return {
    completed: task.completed,
    createdAt: task.createdAt,
    description: task.description,
    dueDate: task.dueDate,
    id: task._id.toString(),
    title: task.title,
    updatedAt: task.updatedAt,
    userId: task.userId.toString(),
  };
}

taskSchema.methods.toResponseObject = function toResponseObject() {
  return toTaskResponseObject(this);
};

module.exports = {
  Task: mongoose.model('Task', taskSchema),
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  toTaskResponseObject,
};
