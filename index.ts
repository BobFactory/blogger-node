import express from 'express';
import path from 'path';
import fs from 'fs';
import util from "util";
import matter from 'gray-matter';

import multer from 'multer';
import sanitizeHtml from 'sanitize-html';
import slugify from 'slugify';
import { Marked } from 'marked';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import { uploadBlog, initFireStore, getAllBlogs, getBlogBySlug } from './firebase/firebase';
import type Blog from './types/blog';
import { main } from 'bun';

const app = express();
const port = 3000;
const db = await initFireStore();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Set up multer for file upload
const upload = multer({ dest: 'uploads/' });

//Set up marked for markdown parsing
const marked = new Marked();

app.get('/', async (req, res) => {
    try {
        const blogPosts = await getAllBlogs(db);
        res.render('index', { blogPosts });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error
        });
    }
});

app.get("/blogs/:slug", async (req, res) => {
    try {
        const slug = req.params.slug
        const blog = await getBlogBySlug(db, slug)
        res.render('blog_details', { blog })
    } catch (error) {
        res.status(404).send({
            status: 'error',
            message: 'Blog not found!',
            error
        })
    }
})


// Define the "upload" endpoint
app.post('/upload', upload.single('file'), async (req, res) => {

    // Check if the request has the 'authorization' header
    if (req.headers['authorization'] !== 'Bearer BDR@124') {
        res.status(401).send('Unauthorized');
    }

    const file = req.file;
    if (!file) {
        throw Error("Please upload a file");
    }

    try {
        const readFile = util.promisify(fs.readFile)
        const fileContents = await readFile(file.path, 'utf-8')

        // Parse the frontmatter using gray-matter
        const { data: frontmatter, content } = matter(fileContents);

        // Convert the content from markdown to HTML
        const htmlContent = await marked.parse(content);

        const unlinkFile = util.promisify(fs.unlink);
        await unlinkFile(file.path);

        const slug = slugify(frontmatter.title.toLowerCase());
        let tags: string[] = [];
        if (frontmatter.tags) {
            tags = frontmatter.tags.split(',').map((tag: string) => tag.trim());
        }

        const blog: Blog = {
            title: frontmatter.title,
            description: frontmatter.description,
            img: frontmatter.img,
            tags,
            slug: slug,
            content: htmlContent,
        };

        // Upload the blog to Firestore
        await uploadBlog(db, blog);

        res.status(201).json({
            status: 'success',
            frontmatter,
        });

    } catch (error) {
        return res.status(500).send('Something wend wrong!');
    }

});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


