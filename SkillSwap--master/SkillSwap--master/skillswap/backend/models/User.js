const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const bcrypt = require('bcryptjs')

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    facebookId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    microsoftId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    tokens: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    profileVisibility: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'public',
      validate: {
        isIn: [['public', 'private', 'friends']],
      },
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    whatsapp: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    telegram: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Mumbai, India',
    },
    profileTitle: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Full Stack Developer',
    },
    tagline: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Code. Learn. Grow. Repeat.',
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'English, Hindi',
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'UTC',
    },
    joinedDate: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    isTeacher: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // Everyone can upload videos by default
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user',
      validate: {
        isIn: [['user', 'developer', 'admin']],
      },
    },
    lecturesCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tasksCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalHours: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    averageRating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    skills: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    projects: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    socialLinks: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    aiInsights: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10)
        }
      },
    },
  }
)

User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password)
}

module.exports = User
