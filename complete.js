var baseUrl = 'https://jsonplaceholder.typicode.com';
var posts = null;
var postMap = {};
var comments = null;
var postListDiv = null;
var postTitlePrefix = 'POST: ';
var commentTitlePrefix = 'COMMENT: ';
var wrapCommentsInBox = true;
var linkAuthorEmail = true;

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

function loadContent(contentType, postLoadMethod) {
	var contentLoaded = false;

	try
	{
		if (typeof(Storage) !== 'undefined') {
			var storageString = localStorage.getItem(contentType + '-content-ids');
			if (storageString) {
				var ids = JSON.parse(storageString);
				
				if (ids && ids.length) {
					var items = [];
					
					for (var i = 0; i < ids.length; i++) {
						var itemStr = localStorage.getItem(contentType + '-content-item-' + ids[i]);
						
						if (itemStr) {
							var item = JSON.parse(itemStr);
							if (item) items.push(item);
						}
					}

					contentLoaded = true;
					postLoadMethod(items);
				}
			}
		}
	}
	catch (e)
	{
		console.error('loadContent Error - ' + e);
	}

	if (!contentLoaded) requestPage('/' + contentType, function (data) { saveContent(contentType, data); postLoadMethod(data); });
}

function saveContent(contentType, data) {
	try
	{
		if (typeof(Storage) !== 'undefined' && data && data.length) {
			var ids = [];
			for (var i = 0; i < data.length; i++) {
				var item = data[i];
				if (item && item.id) {
					ids.push(item.id);
					localStorage.setItem(contentType + '-content-item-' + item.id, JSON.stringify(item));
				}
			}
			
			if (ids.length) localStorage.setItem(contentType + '-content-ids', JSON.stringify(ids));
		}
	}
	catch (e)
	{
		console.error('saveContent Error - ' + e);
	}
}

function removeContent(contentType, id) {
	try
	{
		if (typeof(Storage) !== 'undefined') {
			localStorage.removeItem(contentType + '-content-item-' + id);

			var storageString = localStorage.getItem(contentType + '-content-ids');
			if (!storageString) return;
			
			var ids = JSON.parse(storageString);
			
			if (!ids || !ids.length) return;
			var idx = ids.indexOf(id);

			if (idx < 0) return;
			ids.splice(idx, 1);
			
			localStorage.setItem(contentType + '-content-ids', JSON.stringify(ids));
		}
	}
	catch (e)
	{
		console.error(e);
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

    if (comments !== null) matchAndShow();
}

function loadComments(data) {
    console.log('Got Comments');
    comments = data || [];

    for (var i = 0; i < comments.length; i++) {
        comments[i] = new Comment(comments[i]);
    }

    if (posts !== null) matchAndShow();
}

function matchAndShow() {
    console.log('Matching Posts and Comments');
    for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        var post = postMap[comment.postId];

        if (post) {
            post.comments.push(comment);
            comment.post = post;
        }
    }

	showPostsAndComments();
}

function showPostsAndComments() {
    console.log('Showing Posts and Comments');
    postListDiv.innerHTML = '';
    for (var i = 0; i < posts.length; i++) {
		postListDiv.appendChild(posts[i].getPostElement());
    }

	var allComments = document.getElementsByClassName('comment');

	for (var j = 0; allComments && j < allComments.length; j++) {
		var comment = allComments[j];
		var commentId = comment.id;
		var nodeId = comment.getAttribute('data-node-id');
		var name = comment.getElementsByClassName('comment-name');
		name = name && name.length ? name[0] : null;
		var email = name ? name.getElementsByClassName('comment-email') : null;
		email = email && email.length ? email[0] : null

		// Allow users to delete any comment
		if (email && /[a-z]@/.test(email.innerHTML)) {
			var btn = document.createElement('button');
			btn.innerHTML = 'X';
			btn.setAttribute('title', 'Delete Comment');
			btn.setAttribute('data-comment-id', commentId);
			btn.style.marginRight = '8px';
			if (nodeId) btn.setAttribute('data-node-id', nodeId);
			btn.addEventListener('click', removeComment);
			name.insertBefore(btn, name.childNodes[0]);
		}
	}
	
	var allPosts = document.getElementsByClassName('post');
	for (var i = 0; allPosts && i < allPosts.length; i++) {
		var post = allPosts[i];
		post.addEventListener('mouseenter', function() {
			var titles = this ? this.getElementsByClassName('post-title') : null;
			var title = titles && titles.length ? titles[0] : null;
			if (title) {
				title.classList.add('glowingText');
			}
		});
		post.addEventListener('mouseleave', function() {
			var titles = this ? this.getElementsByClassName('post-title') : null;
			var title = titles && titles.length ? titles[0] : null;
			if (title) {
				title.classList.remove('glowingText');
			}
		});
	}
}

function removeComment() {
	var commentId = this.getAttribute('data-comment-id');
	var nodeId = this.getAttribute('data-node-id');
	var comment = commentId ? document.getElementById(commentId) : null;
	
	if (comment) comment = comment.parentNode.removeChild(comment);
	if (nodeId) removeContent('comments', nodeId);
}

function TitledBody(id, title, body, className) {
	var me = this;
	me.id = id || 0;
	me.title = title || 'A Title';
	me.body = body || '';
	me.className = className || 'element';

	me.getElement = function (titlePrefix, includeBody) {
		var elem = document.createElement('div');
		elem.className = me.className;
		elem.id = me.className + me.id;
		elem.setAttribute('data-node-id', me.id);
		
		var ttl = document.createElement('div');
		ttl.className = me.className + '-title';
		ttl.textContent = titlePrefix + (typeof(me.title) === 'function' ? me.title() : me.title);
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
		var elem = me.getElement(postTitlePrefix, true);

		if (me.comments && me.comments.length) {
			var lst = null;

			if (wrapCommentsInBox) {
				lst = document.createElement('div');
				lst.className = 'comments-list';
			} else {
				lst = elem;
			}

			for (var i = 0; i < me.comments.length; i++) {
				lst.appendChild(me.comments[i].getCommentElement());
			}
			
			if (wrapCommentsInBox) elem.appendChild(lst);
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
		var elem = me.getElement(commentTitlePrefix, true);
		var name = document.createElement('div');
		name.className = 'comment-name';
		name.innerHTML = 'By ';
		
		var email = document.createElement(linkAuthorEmail ? 'a' : 'span');
		email.className = 'comment-email';
		if (linkAuthorEmail) email.href = 'mailto:' + me.email;
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

function showPreferences(hide) {
	document.getElementById('showPreferencesBar').style.display = hide ? "block" : "none";
	document.getElementById('preferencesContainer').style.display = hide ? "none" : "block";
}

function loadPreferences() {
	try
	{
		if (typeof(Storage) !== 'undefined') {
			var styleIndex = localStorage.getItem("selected-style");
			if (styleIndex && /^[1-3]$/.test(styleIndex)) {
				document.getElementById('styleSelect').value = styleIndex;
			}

			var prefixesStr = localStorage.getItem("prefixes");
			if (prefixesStr) {
				var prefixes = JSON.parse(prefixesStr);
				document.getElementById('postPrefix').value = prefixes['post'];
				document.getElementById('commentPrefix').value = prefixes['comment'];
			}

			var booleansStr = localStorage.getItem("booleans");
			if (booleansStr) {
				var booleans = JSON.parse(booleansStr);
				document.getElementById('wrapComments').checked = booleans[0];
				document.getElementById('linkAuthor').checked = booleans[1];
			}
		}
	}
	catch (e)
	{
		console.error(e);
	}

	showPreferences(true);
}

function applyPreferences() {
	var val = document.getElementById('styleSelect').value;
	postTitlePrefix = document.getElementById('postPrefix').value;
	commentTitlePrefix = document.getElementById('commentPrefix').value;
	wrapCommentsInBox = document.getElementById('wrapComments').checked;
	linkAuthorEmail = document.getElementById('linkAuthor').checked;

	document.styleSheets[1].disabled = (val != '1');
	document.styleSheets[2].disabled = (val != '2');
	document.styleSheets[3].disabled = (val != '3');

	try
	{
		if (typeof(Storage) !== 'undefined') {
			localStorage.setItem("selected-style", val);
			localStorage.setItem("prefixes", JSON.stringify({post:postTitlePrefix,comment:commentTitlePrefix}));
			localStorage.setItem("booleans", JSON.stringify([wrapCommentsInBox,linkAuthorEmail]));
		}
	}
	catch (e)
	{
		console.error(e);
	}

	showPreferences(true);
    if (posts !== null && comments !== null) showPostsAndComments();
}

function enterDiv(divId) {
	var div = document.getElementById(divId);
	div.className = 'highlight';
	div.style.fontWeight = 'bold';
}

function leaveDiv(divId) {
	var div = document.getElementById(divId);
	div.className = '';
	div.style.fontWeight = '';
}

function validatePrefix(inputId) {
	var inp = document.getElementById(inputId);
	var val = inp.value;
	
	inp.style.backgroundColor = /[`~!@#$%^&*<>'"]/.test(val) ? '#ffbbbb' : '';
}

function handleContentLoaded() {
    console.log('ContentLoaded');
    postListDiv = document.getElementById('postList');
	//Simulate server processing time in loading a complicated pageX
	setTimeout(function() {
		loadContent('posts', loadPosts);
		loadContent('comments', loadComments);
	}, 2000);
	loadPreferences();
	applyPreferences();
}

document.addEventListener("DOMContentLoaded", handleContentLoaded);