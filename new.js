let data = fetch('https://api.myjson.com/bins/152f9j')
  .then((response) => {
    return response.json()
  })
  .catch((err) => {
    console.log(err)
  });

const mainDiv = document.getElementById('main');
let postsOnPage = 10;
let savedTags = getSavedTags();
const searchInput = document.getElementById('search');
const footer = document.querySelector('.footer');
const tags = document.querySelector('.chooseTag');
const upBtn = document.querySelector('.up-btn');


function getSavedTags() {
  if (localStorage.getItem('tags')) {
    let tags = localStorage.getItem('tags').split(',');
    for(let tag of tags) {
      tag = tag.toLowerCase();
      let oldTag = document.getElementById(tag);
      oldTag.className = 'tag checked'
    }
    return tags
  }
  return []
}

data.then((posts) => {
  mainData = posts.data.sort(sortByDate)
  if (savedTags) {
    mainData = matchedTags(mainData, savedTags);
  }
  tagClickListen(mainData);
  infiniteScroll(mainData);

  searchInput.addEventListener('keyup', () => searchPosts(mainData, searchInput.value))

  });

function scrollUp (posts) {
    let pageY = window.pageYOffset || document.documentElement.scrollTop;
    let innerHeight = document.documentElement.clientHeight;
    if (pageY > innerHeight) {
      upBtn.style.display = 'inline';
      upBtn.onclick = () => {
        window.scrollTo(0,0);
      }
    } else {
      upBtn.style.display = 'none';
    }
}
function searchPosts (posts, value) {
    if (!searchInput.value) {
      removeAllPosts(mainDiv);
      infiniteScroll(posts)
      return
    }
    foundPosts = search(posts, value);
    if (foundPosts.length > 0) {
      removeAllPosts(mainDiv);
      infiniteScroll(foundPosts);
    } else {
      let notFound = document.createElement('h2');
      notFound.innerText = `"${searchInput.value}" not found`;
      removeAllPosts(mainDiv);
      mainDiv.appendChild(notFound);
    }
}


function infiniteScroll(posts) {
  let partedPosts = divideArray(posts);
  showPosts(partedPosts.shift());

  document.onscroll = () => {
      scrollUp();
      appendNext(partedPosts);
    }

  };


function appendNext(posts) {
  if (posts.length && isAppearOnScreen(footer)) {
    showPosts(posts.shift());
  }
}

function tagClickListen(posts) {
  let theParent = document.getElementById("parent-list");
  theParent.addEventListener("click", (event) => {
    if (event.target.tagName === "LI") {
      event.target.classList.toggle("checked");
    }
    let choosedTags = document.querySelectorAll('.chooseTag li.checked');
    let tags = [];
    if (choosedTags.length) {
      for (let tag of choosedTags) {
        tags.push(tag.innerText);
        localStorage.setItem('tags', tags);
      }
      let tagedPosts = matchedTags(posts, tags);
      removeAllPosts(mainDiv);
      infiniteScroll(tagedPosts);
    } else {
      localStorage.clear();
      removeAllPosts(mainDiv);
      infiniteScroll(posts);
    }
  });
}

main.addEventListener('click', event => {
  deletePost(mainData, event.target, mainDiv);
})

function showPosts(posts) {
  for (let post of posts) {
    mainDiv.appendChild(itemCreate(post));
  }
}

function removeAllPosts(parent) {
  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }
}

function matchedTags(posts, tags) {
  for (let post of posts) {
      let postTags = new Set(post['tags']);
      let match = new Set([...tags].filter(tag => postTags.has(tag)));
      post['matchTags'] = match.size;
  }
  let splitByMatch = posts.reduce((matchCount, post) => {
      if (!matchCount[post['matchTags']]) {
          matchCount[post['matchTags']] = [];
      }
      matchCount[post['matchTags']].push(post);
      return matchCount
  }, {});

  let postsList = [];

  for (let matchCount of Object.keys(splitByMatch)) {
      splitByMatch[matchCount].sort(sortByDate);
      postsList.unshift(...splitByMatch[matchCount])
  }
  return postsList
}


function sortByDate(post1, post2) {
  return new Date(post2['createdAt']) - new Date(post1['createdAt']);
}

function search(data, text) {
  let regular = new RegExp(text, 'i');
  return data.filter((post) => post.title.search(regular) !== -1);
}

function isAppearOnScreen(elem) {
  let shape = elem.getBoundingClientRect();
  let html = document.documentElement;
  return (
    shape.top >= 0 &&
    shape.left >= 0 &&
    shape.bottom <= (window.innerHeight || html.clientHeight) &&
    shape.right <= (window.innerWidth || html.clientWidth)
  );
}

let itemCreate = (item) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'news__item';

    const image = document.createElement('img');
    image.src = item.image;
    image.alt = 'image';

    const title = document.createElement('h3');
    title.innerHTML = item.title;

    const description = document.createElement('p');
    description.innerHTML = item.description;

    const createdAt = document.createElement('span');
    const date = new Date(item.createdAt);
    createdAt.innerHTML = date.toDateString();

    const deleteButton = document.createElement('i');
    deleteButton.className = 'fa fa-times';
    itemDiv.appendChild(deleteButton);
    itemDiv.appendChild(image);
    itemDiv.appendChild(title);
    itemDiv.appendChild(description);

    const tags = document.createElement('ul');
    for (let tagIndex = 0; tagIndex < item.tags.length; tagIndex++) {
      const tag = document.createElement('li');
      tag.innerHTML = item.tags[tagIndex];
      tags.appendChild(tag);
    }
    itemDiv.appendChild(tags);
    itemDiv.appendChild(createdAt);
    return itemDiv;
};

function divideArray(arr, chunk = postsOnPage) {
  let parted = [];
  for (let step = 0; step < arr.length; step += chunk) {
      parted.push(arr.slice(step, step + chunk));
  }
  return parted;
}

function deletePost(data, elem, deleteArea) {
  if (elem.nodeName === 'I') {
    deleteArea.removeChild(elem.parentNode);
    let title = elem.parentNode.childNodes[2].innerText;
    let findPost = data.filter((post) => post.title === title);
    let postIndex = data.indexOf(findPost[0]);
    data.splice(postIndex, 1);
  }
}


