/** @type {Array<{
 *      element: HTMLElement,
 *      title: String,
 *      items: Array<{
 *          element: HTMLElement,
 *          value: String,
 *          checkedBy: Array<String>,
 *          percentage: Number,
 *          UpdatePercentage: (checked: Boolean) => void,
 *      }>,
 *      participatedUsers: Array<{
 *          name: String,
 *          selectedItemIndex: Number,
 *      }>,
 * }>}
 */
let Polls = [];
/** The name of the current user signed in.
 */
let CurrentUserName = "";

SetUp();

/** Sets up everything within the document.
 */
function SetUp() {
    SetUpPolls();
    SetUpUserSigningIn();
}

/** Sets up the polls within the document.
 */
function SetUpPolls() {
    let pollElements = Array.from(document.querySelectorAll('poll'));
    pollElements.forEach((pollElement, pollIndex) => {
        pollElement.innerHTML = "";

        let header = CreateElement("header", pollElement);
        let headerContent = CreateElement("p", header);
        let title = headerContent.innerText = pollElement.getAttribute("pollTitle");

        let viewVotesButton = CreateElement("button", header, "view-votes-button");
        viewVotesButton.innerText = "📢";
        viewVotesButton.title = "View Votes";

        let unorderList = CreateElement("ul", pollElement);

        let itemValues = pollElement.getAttribute("items").split("|"),
            items = [];
        itemValues.forEach(itemValue => {
            let listItem = CreateElement("li", unorderList);
            listItem.tabIndex = 0;
            listItem.title = "Selected by no user.";

            CreateElement("div", listItem, "checkbox");

            let textContainer = CreateElement("p", listItem);
            textContainer.innerText = itemValue;

            CreateElement("div", listItem, "percentage");

            let item = new PollItem(pollIndex, listItem, itemValue);
            item.percentage = 0;

            listItem.addEventListener("click", CreatePollItemClick(item));
            listItem.addEventListener("keydown", CreatePollItemKeydown(item));
            items.push(item);
        });

        let poll = new Poll(pollElement, title, items);

        let viewVotesButtonClick = CreateViewVotesButtonClick(poll);
        viewVotesButton.addEventListener("click", viewVotesButtonClick);

        let viewVotesPanel = CreateElement("div", pollElement, ["view-votes-panel", "disabled"]);
        let viewVotesCloseButton = CreateElement("button", viewVotesPanel, "view-votes-close-button");
        viewVotesCloseButton.addEventListener("click", viewVotesButtonClick);
        viewVotesCloseButton.tabIndex = -1;

        Polls.push(poll);
    });
}

/** Creates a new element and added into a parent element.
 * @param {String} type The type of the element that'll be created.
 * @param {HTMLElement} parent The parent element that contains the element.
 * @param {String | Array<String>} classList The class name of the element, or the class list of it.
 * @param {String} id The identifier of the element.
 * @returns The element after being created.
 */
function CreateElement(type, parent, classList = [], id = "") {
    let element = document.createElement(type);

    parent.append(element);

    if (typeof (classList) == "string") { element.className = classList; }
    else { classList.forEach(className => element.classList.add(className)); }

    element.id = id;

    return element;
}

/** Creates a new poll object.
 * @param {HTMLElement} element The poll element itself.
 * @param {String} title The title of the poll.
 * @param {Array<{
 *      element: HTMLElement,
 *      value: String,
 *      checkedBy: String,
 *      percentage: Number,
 *      UpdatePercentage: (checked: Boolean) => void,
 * }>} items The items contained by the poll.
 * @param {Array<{
 *      name: String,
 *      selectedItemIndex: Number,
 * }>} participatedUsers The users that are participated in the poll.
 * @returns A new poll object.
 */
function Poll(element, title, items, participatedUsers = []) {
    return {
        element: element,
        title: title,
        items: items,
        participatedUsers: participatedUsers,
    };
}

/** Creates a new poll item object.
 * @param {Number} pollIndex The index of the poll responsible for the item.
 * @param {HTMLElement} element The item element itself.
 * @param {String} value The value of the item.
 * @param {Array<String>} checkedBy Determines whether or not the item is checked by some users.
 * @param {Number} percentage The amount of percentage the item has.
 */
function PollItem(pollIndex, element, value, checkedBy = [], percentage = 0) {
    return {
        pollIndex: pollIndex,
        element: element,
        value: value,
        checkedBy: checkedBy,
        percentage_: percentage,

        poll_: null,
        get poll() { return this.poll_ = this.poll_ ?? Polls[pollIndex]; },

        get percentage() { return this.percentage_; },
        set percentage(value) {
            value = value < 0 || Number.isNaN(value) ? 0 : value > 100 ? 100 : value;

            this.percentage_ = value;
            let percentageElement = this.element.querySelector(".percentage");
            percentageElement.innerText = `${value}%`;
            this.element.style.setProperty("--percentage", value);
        },

        /** Updates the percantege aspect of the item element.
         * @param {Boolean} checked Determines whether or not the item element will be checked.
         */
        UpdatePercentage(checked) {
            this.element.style.setProperty("--check-image", `url("Images/square${checked ? "_checked" : ""}.png")`);

            let userCount = this.checkedBy.length;
            this.percentage = Math.round(userCount / this.poll.participatedUsers.length * 100);
            this.element.title = !userCount ? "Selected by no user." : `Selected by ${userCount} user${userCount > 1 ? "s" : ""}.`;
        }
    };
}

/** Creates a new poll item click event.
 * @param {{
 *      pollIndex: Number,
 *      element: HTMLElement,
 *      value: String,
 *      checkedBy: Array<String>,
 *      percentage: Number,
 *      UpdatePercentage: (checked: Boolean) => void,
 * }} pollItem The poll item object itself.
 * @returns A new click event for the poll item element.
 */
function CreatePollItemClick(pollItem) { return (e) => PollItemClick(pollItem); }

/** Creates a new poll item keydown event.
 * @param {{
 *      pollIndex: Number,
 *      element: HTMLElement,
 *      value: String,
 *      checkedBy: Array<String>,
 *      percentage: Number,
 *      UpdatePercentage: (checked: Boolean) => void,
 * }} pollItem The poll item object itself.
 * @returns A new keydown event for the poll item element.
 */
function CreatePollItemKeydown(pollItem) {
    return (e) => { if (["Enter", " "].includes(e.key)) { PollItemClick(pollItem); } }
}

/** Occurs whenever a poll item is clicked.
 * @param {{
 *      pollIndex: Number,
 *      element: HTMLElement,
 *      value: String,
 *      checkedBy: Array<String>,
 *      percentage: Number,
 *      UpdatePercentage: (checked: Boolean) => void,
 * }} pollItem The poll item object itself.
 */
function PollItemClick(pollItem) {
    if (CurrentUserName == "") { return; }

    if (pollItem.checkedBy.includes(CurrentUserName)) {
        pollItem.poll.participatedUsers = pollItem.poll.participatedUsers.filter(user => user.name != CurrentUserName);

        pollItem.poll.items.forEach(item => {
            item.checkedBy = item.checkedBy.filter(user => user != CurrentUserName);
            item.UpdatePercentage(false);
        });
        return;
    }

    let itemIndex = pollItem.poll.items.indexOf(pollItem),
        user = pollItem.poll.participatedUsers.filter(user => user.name == CurrentUserName);

    if (user.length > 0) { user = user[0]; }
    else { pollItem.poll.participatedUsers.push(user = new User(CurrentUserName, itemIndex)); }

    user.selectedItemIndex = itemIndex;

    pollItem.poll.items.forEach(item => {
        item.checkedBy = item.checkedBy.filter(user => user != CurrentUserName);
        item.UpdatePercentage(false);
    });
    pollItem.checkedBy.push(CurrentUserName);
    pollItem.UpdatePercentage(true);
}

/** Sets up everything about user signing in.
 */
function SetUpUserSigningIn() {
    let userInput = document.querySelector("#user input"),
        signInButton = document.querySelector("#user button");

    userInput.addEventListener("change",
        (e) => userInput.className = userInput.value.trim() != CurrentUserName ? "invalid" : ""
    );

    signInButton.addEventListener("click", (e) => {
        userInput.className = "";
        CurrentUserName = userInput.value.trim();

        Polls.forEach(poll => poll.items.forEach(
            item => item.UpdatePercentage(item.checkedBy.includes(CurrentUserName))
        ));
    });
}

/** Creates a new user.
 * @param {String} name The name of the user.
 * @param {Number} selectedItemIndex The index of the item the user selected.
 * @returns The user.
 */
function User(name, selectedItemIndex) {
    return {
        name: name,
        selectedItemIndex: selectedItemIndex,
    };
}

/** Creates a new view votes button click event.
 * @param {{
 *      element: HTMLElement,
 *      title: String,
 *      items: Array<{
 *          element: HTMLElement,
 *          value: String,
 *          checkedBy: Array<String>,
 *          percentage: Number,
 *          UpdatePercentage: (checked: Boolean) => void,
 *      }>,
 *      participatedUsers: Array<{
 *          name: String,
 *          selectedItemIndex: Number,
 *      }}} poll The poll that its votes are going to be shown.
 * @returns A new click event for the poll item element.
 */
function CreateViewVotesButtonClick(poll) {
    return (e) => {
        let viewVotesPanel = poll.element.querySelector(".view-votes-panel");
        viewVotesPanel.classList.toggle("disabled");
        poll.element.classList.toggle("disabled");
        
        let disabled = !viewVotesPanel.className.includes("disabled");

        let viewVotesButton = poll.element.querySelector(".view-votes-button"),
            viewVotesCloseButton = poll.element.querySelector(".view-votes-close-button");

        viewVotesButton.tabIndex = disabled ? -1 : 0;
        viewVotesCloseButton.tabIndex = disabled ? 0 : -1;

        poll.items.forEach(item => item.element.tabIndex = disabled ? -1 : 0);

        let participantEmpty = viewVotesPanel.querySelector(".participant-empty");
        participantEmpty?.remove();

        let participantContainers = Array.from(viewVotesPanel.querySelectorAll(".participant-container"));
        participantContainers.forEach(participantContainer => participantContainer.remove());

        if (!disabled) { return; }

        if (!poll.participatedUsers.length)
        {
            let participantEmpty = CreateElement("div", viewVotesPanel, "participant-empty");
            participantEmpty.innerText = "The are no participants in this poll yet.";
            return;
        }

        poll.participatedUsers.forEach(user => {
            let participantContainer = CreateElement("div", viewVotesPanel, "participant-container"),
                participantImage = CreateElement("button", participantContainer, "participant-image"),
                participantName = CreateElement("p", participantContainer, "participant-name"),
                participantItem = CreateElement("p", participantContainer, "participant-item");

            participantImage.innerText = user.name[0];
            participantName.innerText = user.name;
            participantItem.innerText = poll.items[user.selectedItemIndex].value;

            participantImage.title = `Click to sign in with ${user.name} account.`

            participantImage.addEventListener("click", (e) => {
                CurrentUserName = user.name;

                let userInput = document.querySelector("#user input");
                userInput.value = user.name;

                let userButton = document.querySelector("#user button");
                userButton.click();
            });
        });
    };
}

// let degree = 0;
// setInterval(() => {
//     document.body.style.setProperty("--main-colour", `hsl(${degree++}deg, 78%, 57%)`);
// }, 1);