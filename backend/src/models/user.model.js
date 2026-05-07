const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      lowercase: true,
      maxlength: 320,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      required: true,
      trim: true,
      type: String,
      unique: true,
    },
    emailVerificationTokenExpiresAt: {
      type: Date,
    },
    emailVerificationTokenHash: {
      select: false,
      type: String,
    },
    isEmailVerified: {
      default: false,
      type: Boolean,
    },
    lastLoginAt: {
      type: Date,
    },
    name: {
      maxlength: 60,
      minlength: 2,
      required: true,
      trim: true,
      type: String,
    },
    passwordHash: {
      required: true,
      select: false,
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    createdAt: this.createdAt,
    email: this.email,
    id: this._id.toString(),
    isEmailVerified: this.isEmailVerified,
    lastLoginAt: this.lastLoginAt,
    name: this.name,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = { User };
