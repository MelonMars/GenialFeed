const linkTemplate = document.getElementById("linkTemplate");
const linkContainer = document.getElementById("linkContainer");
const loadingSpinner = document.getElementById('loadingSpinner');
const colorToggle = document.getElementById("colorToggle");

let pageNumber = 0
let loading = false;

/*
async function makeMainPage() {
    const linksPerPage = 10;
    if (loading) return;
    loading = true;
    loadingSpinner.style.display = 'block';
    try {
        const response = await fetch("http://127.0.0.1:1235/links/?page=" + pageNumber);
        let data = await response.json();
        data = JSON.parse(data);
        for (const key of Object.keys(data)) {
            const clone = document.importNode(linkTemplate.content, true);
            const titleElem = clone.querySelector('.Title');
            const linkElem = clone.querySelector(".titleLink")
            titleElem.textContent = key;
            linkElem.href = data[key];
            linkContainer.appendChild(clone);
        }
        pageNumber++;
    } catch (error) {
        console.error(error);
    } finally {
        loading = false;
        loadingSpinner.style.display = 'none';
    }
}

function onScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        makeMainPage();
    }
}
*/
function toggleColor() {
    const toggleElem = document.getElementById("colorToggle");
    const isLightMode = document.body.classList.toggle('light-mode');

    for (let element of document.getElementsByTagName('*')) {
        if (isLightMode) {
            element.classList.add('light-mode');
        } else {
            element.classList.remove('light-mode');
        }
    }

    localStorage.setItem('lightMode', isLightMode ? 'enabled' : 'disabled');

    toggleElem.innerText = isLightMode ? "🌑" : "☀️";
}

document.addEventListener('DOMContentLoaded', () => {
    const savedMode = localStorage.getItem('lightMode');
    if (savedMode === 'enabled') {
        document.body.classList.add('light-mode');
        document.getElementById("colorToggle").innerText = "🌛";
    } else {
        document.body.classList.remove('light-mode');
        document.getElementById("colorToggle").innerText = "☀️";
    }
});

/*
makeMainPage();

window.addEventListener('scroll', onScroll);
 */

colorToggle.addEventListener('click', toggleColor);
if (localStorage.getItem('lightMode') === 'enabled') {
    document.body.classList.add('light-mode');
}