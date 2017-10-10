var baseUrl = 'https://jsonplaceholder.typicode.com';
var posts = null;
var postMap = {};
var comments = null;
var postListDiv = null;

function requestPage(relativeUrl, content, success, error) {
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

function loadPosts(data) {
    console.log('Got Posts');
    posts = data || [];

    for (var i = 0; i < posts.length; i++) {
        var post = new Post(posts[i]);
        postMap[post.id] = post;
        posts[i] = post;
    }

    if (comments !== null) showPostsAndComments();
}

function loadComments(data) {
    console.log('Got Comments');
    comments = data || [];

    for (var i = 0; i < comments.length; i++) {
        comments[i] = new Comment(comments[i]);
    }

    if (posts !== null) showPostsAndComments();
}

function showPostsAndComments() {
    console.log('Showing Posts and Comments');
    for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        var post = postMap[comment.postId];

        if (post) {
            post.comments.push(comment);
            comment.post = post;
        }
    }

    postListDiv.innerHTML = '';
    for (var i = 0; i < posts.length; i++) {
		postListDiv.appendChild(posts[i].getPostElement());
    }

	var allComments = document.getElementsByClassName('comment');

	for (var j = 0; allComments && j < allComments.length; j++) {
		var comment = allComments[j];
		var commentId = comment.id;
		var name = comment.getElementsByClassName('comment-name');
		name = name && name.length ? name[0] : null;
		var email = name ? name.getElementsByClassName('comment-email') : null;
		email = email && email.length ? email[0] : null

		// Simulate finding all comments for the current user, so that they can delete their own comments
		if (email && /n@/.test(email.innerHTML)) {
			var btn = document.createElement('button');
			btn.innerHTML = 'X';
			btn.setAttribute('title', 'Delete Comment');
			btn.setAttribute('data-comment-id', commentId);
			btn.addEventListener('click', removeComment);
			name.insertBefore(btn, name.childNodes[0]);
		}
	}
}

function removeComment() {
	var commentId = this.getAttribute('data-comment-id');
	var comment = commentId ? document.getElementById(commentId) : null;
	
	if (comment) comment = comment.parentNode.removeChild(comment);
}

function TitledBody(id, title, body, className) {
	var me = this;
	me.id = id || 0;
	me.title = title || 'A Title';
	me.body = body || '';
	me.className = className || 'element';

	me.getElement = function (includeBody) {
		var elem = document.createElement('div');
		elem.className = me.className;
		elem.id = me.className + me.id;
		
		var ttl = document.createElement('div');
		ttl.className = me.className + '-title';
		ttl.textContent = typeof(me.title) === 'function' ? me.title() : me.title;
		elem.appendChild(ttl);
		
		if (includeBody) elem.appendChild(me.getBodyElement());
		
		return elem;
	};
	me.getBodyElement = function () {
		var bdy = document.createElement('div');
		bdy.className = me.className + '-body';
		bdy.textContent = typeof(me.body) === 'function' ? me.body() : me.body;
		return bdy;
	};
}

function Post(rawPost) {
    var me = this;

	rawPost = rawPost || {};
	TitledBody.call(me, rawPost.id, rawPost.title, rawPost.body, 'post');

    me.userId = rawPost.userId || 0;

    me.comments = [];
    me.user = null;

	me.getPostElement = function () {
		var elem = me.getElement(true);

		if (me.comments && me.comments.length) {
			var lst = document.createElement('div');
			lst.className = 'comments-list';

			for (var i = 0; i < me.comments.length; i++) {
				lst.appendChild(me.comments[i].getCommentElement());
			}
			
			elem.appendChild(lst);
		}
		
		return elem;
	};
}
Post.prototype = Object.create(TitledBody.prototype);
Post.prototype.constructor = Post;

function Comment(rawComment) {
    var me = this;

	rawComment = rawComment || {};
	TitledBody.call(me, rawComment.id, rawComment.name || function() { return 'RE: ' + (me.post ? me.post.title : ''); } , rawComment.body, 'comment');

    me.postId = rawComment.postId || 0;
    me.email = rawComment.email || null;

    me.post = null;

	me.getCommentElement = function () {
		var elem = me.getElement(true);
		var name = document.createElement('div');
		name.className = 'comment-name';
		name.innerHTML = 'By ';
		
		var email = document.createElement('a');
		email.className = 'comment-email';
		email.href = 'mailto:' + me.email;
		email.textContent = me.email;
		name.appendChild(email);
		
		elem.appendChild(name);
		
		return elem;
	};
}
Comment.prototype = Object.create(TitledBody.prototype);
Comment.prototype.constructor = Comment;

function showError(error) {
    postListDiv.innerHTML = 'Could not load the posts - ' + error;
}

function handleContentLoaded() {
    console.log('ContentLoaded');
    postListDiv = document.getElementById('postList');
	//Simulate server processing time in loading a complicated pageX
	setTimeout(function() {
		requestPage('/posts', loadPosts);
		requestPage('/comments', loadComments);
	}, 4000);
}

document.addEventListener("DOMContentLoaded", handleContentLoaded);