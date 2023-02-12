const lodash = require("lodash");

const dummy = (blogs) => {
  return blogs.length + 1;
};

const totalLikes = (blogs) => {
  const reducer = (sum, item) => {
    return sum + item.likes;
  };

  return blogs.reduce(reducer, 0);
};

const favoriteBlog = (blogs) => {
  const likes = blogs.map((blog) => blog.likes);
  const blog = blogs[likes.indexOf(Math.max(...likes))];
  return blog;
};

const mostBlogs = (blogs) => {
  const authorsBlogsNumber = lodash.countBy(blogs, "author");
  const maxValue = Math.max(...Object.values(authorsBlogsNumber));
  const maxIndex = Object.keys(authorsBlogsNumber).find(
    (key) => authorsBlogsNumber[key] === maxValue
  );

  return {
    author: maxIndex,
    blogs: maxValue,
  };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs
};
