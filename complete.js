var baseUrl = 'https://jsonplaceholder.typicode.com';
var posts = null;
var postMap = {};
var comments = null;
var postListDiv = null;

function RequestPage(relativeUrl, content, success, error) {
    if (typeof(relativeUrl) !== 'string') return;
    if (typeof(content) === 'function') { error = success; success = content; content = null; }
    if (typeof(content) !== 'undefined' && content !== null && typeof(content) !== 'string') content = JSON.stringify(content);

    var url = baseUrl + relativeUrl;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            var data = this.responseText;
            try {
                data = JSON.parse(data);
            } catch (e) {}

            var method = this.status == 200 ? success : error;

            if (typeof(method) === 'function') method(data, this.status, this);
        }
    }

    if (content == null) {
        xhr.open('GET', url, true);
        xhr.send();
    } else {
        xhr.open('POST', url, true);
        xhr.send(content);
    }
}

function LoadPosts(data) {
    console.log('Got Posts');
    posts = data || [];

    for (var i = 0; i < posts.length; i++) {
        var post = new Post(posts[i]);
        postMap[post.id] = post;
        posts[i] = post;
    }

    if (comments !== null) ShowPostsAndComments();
}

function LoadComments(data) {
    console.log('Got Comments');
    comments = data || [];

    for (var i = 0; i < comments.length; i++) {
        comments[i] = new Comment(comments[i]);
    }

    if (posts !== null) ShowPostsAndComments();
}

function ShowPostsAndComments() {
    console.log('Showing Posts and Comments');
    for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        var post = postMap[comment.postId];

        if (post) {
            post.comments.push(comment);
            comment.post = post;
        }
    }

    var html = [];
    for (var i = 0; i < posts.length; i++) {
        AddPost(html, posts[i]);
    }

    postListDiv.innerHTML = html.join('');
}

function AddPost(html, post) {
    if (!post) return;

    html.push('<div class="post" id="post');
    html.push(post.id);
    html.push('"><div class="post-title">');
    html.push(post.title);
    html.push('</div><div class="post-body">');
    html.push(post.body);
    html.push('</div>');

    AddUser(html, post.user);
    
    if (post.comments && post.comments.length) {
        html.push('<div class="comments-list">Comments:');

        for (var j = 0; j < post.comments.length; j++) {
            AddComment(html, post.comments[j]);
        }

        html.push('</div>');
    }

    html.push('</div>');
}

function AddComment(html, comment) {
    if (!comment) return;
    
    html.push('<div class="comment" id="comment');
    html.push(comment.id);
    html.push('"><div class="comment-body">');
    html.push(comment.body);
    html.push('</div><div class="comment-name">By ');
    html.push(comment.name);
    if (comment.email) {
        html.push(' (<a class="comment-email" href="mailto:');
        html.push(comment.email);
        html.push('">');
        html.push(comment.email);
        html.push('</a>)');
    }
    html.push('</div></div>');
}

function AddUser(html, user) {
    if (!user) return;
    
}

function Post(rawPost) {
    var me = this;

    me.id = rawPost.id || 0;
    me.userId = rawPost.userId || 0;
    me.title = rawPost.title || 'A Title';
    me.body = rawPost.body || '';

    me.comments = [];
    me.user = null;
}
function Comment(rawComment) {
    var me = this;

    me.id = rawComment.id || 0;
    me.postId = rawComment.postId || 0;
    me.name = rawComment.name || 'Commenter';
    me.email = rawComment.email || null;
    me.body = rawComment.body || '';

    me.post = null;
}

function ShowError(error) {
    postListDiv.innerHTML = 'Could not load the posts - ' + error;
}

function HandleContentLoaded() {
    console.log('ContentLoaded');
    postListDiv = document.getElementById('postList');
    RequestPage('/posts', LoadPosts);
    RequestPage('/comments', LoadComments);
}

document.addEventListener("DOMContentLoaded", HandleContentLoaded);