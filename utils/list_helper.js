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

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
};
