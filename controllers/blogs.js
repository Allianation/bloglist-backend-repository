const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const middleware = require("../utils/middleware");

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 });
  response.json(blogs);
});

// use middleware only for a specific operation
blogsRouter.post("/", middleware.userExtractor, async (request, response) => {
  const body = request.body;
  const user = request.user;

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: user._id,
  });

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  response.status(201).json(savedBlog);
});

blogsRouter.delete("/:id", middleware.userExtractor, async (request, response) => {
  const user = request.user;

  const { id } = request.params;
  const blog = await Blog.findById(id);

  if (blog.user.toString() !== user.id.toString()) {
    return response
      .status(401)
      .json({ error: "only the creator can delete blogs" });
  }

  user.blogs = user.blogs.filter((b) => b.toString() !== blog.id.toString());

  await blog.remove();
  await user.save();
  
  response.status(204).end();
});

blogsRouter.put("/:id", async (request, response) => {
  const { id } = request.params;
  const body = request.body;

  const newBlogInfo = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(id, newBlogInfo, {
    new: true,
  });

  response.json(updatedBlog);
});

module.exports = blogsRouter;
