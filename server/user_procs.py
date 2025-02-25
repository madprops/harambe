from __future__ import annotations

# Standard
import time
from dataclasses import dataclass
from collections import deque
from typing import Any

# Libraries
from flask import Request  # type: ignore
from werkzeug.security import generate_password_hash as hashpass  # type: ignore
from werkzeug.security import check_password_hash as checkpass  # pyright: ignore

# Modules
import utils
from config import config
import database
from database import User as DbUser


class UserData:
    def __init__(self, rpm: int) -> None:
        self.timestamps: deque[float] = deque()
        self.rpm = rpm
        self.window = 60

    def increment(self) -> None:
        now = time.time()
        self.timestamps.append(now)

        while self.timestamps and (self.timestamps[0] < (now - self.window)):
            self.timestamps.popleft()

    def blocked(self) -> bool:
        self.increment()
        return len(self.timestamps) > self.rpm


@dataclass
class User:
    username: str
    password: str
    admin: bool
    name: str
    rpm: int
    max_size: int
    rpm_fill: int
    max_size_fill: int
    reader: bool
    mark: str
    register_date: int
    register_date_str: str
    last_date: int
    last_date_str: str
    admin_str: str
    reader_str: str
    lister: bool
    lister_str: str
    poster: bool
    reacter: bool
    poster_str: str
    reacter_str: str
    num_posts: int
    num_reactions: int


user_types = {
    "username": "string",
    "password": "string",
    "admin": "bool",
    "name": "string",
    "rpm": "int",
    "max_size": "int",
    "reader": "bool",
    "mark": "string",
    "register_date": "int",
    "last_date": "int",
    "lister": "bool",
    "posts": "int",
    "reactions": "int",
    "poster": "bool",
    "reacter": "bool",
}


user_data: dict[str, UserData] = {}


def make_user(user: DbUser) -> User:
    reg_date_str = utils.nice_date(user.register_date)
    last_date_str = utils.nice_date(user.last_date)
    admin_str = "A: Yes" if user.admin else "A: No"
    reader_str = "D: Yes" if user.reader else "D: No"
    rpm_fill = user.rpm or config.requests_per_minute
    max_size_fill = user.max_size or config.max_size_user
    lister_str = "L: Yes" if user.lister else "R: No"
    poster_str = "P: Yes" if user.poster else "P: No"
    reacter_str = "R: Yes" if user.reacter else "R: No"
    num_posts = user.num_posts if user.num_posts else 0
    num_reactions = user.num_reactions if user.num_reactions else 0

    return User(
        user.username,
        user.password,
        user.admin,
        user.name,
        user.rpm,
        user.max_size,
        rpm_fill,
        max_size_fill,
        user.reader,
        user.mark,
        user.register_date,
        reg_date_str,
        user.last_date,
        last_date_str,
        admin_str,
        reader_str,
        user.lister,
        lister_str,
        user.poster,
        user.reacter,
        poster_str,
        reacter_str,
        num_posts,
        num_reactions,
    )


def get_userlist(username: str = "") -> list[User]:
    users = database.get_users(username=username)
    return [make_user(user) for user in users]


def get_users(
    page: int = 1,
    page_size: str = "default",
    query: str = "",
    sort: str = "register_date",
    admin: bool = False,
    username: str = "",
) -> tuple[list[User], str, bool]:
    psize = 0

    if page_size == "default":
        psize = config.admin_page_size
    elif page_size == "all":
        pass  # Don't slice later
    else:
        psize = int(page_size)

    users = []
    query = utils.clean_query(query)

    for user in get_userlist():
        if username:
            if user.username != username:
                continue

        ok = (
            not query
            or query in utils.clean_query(user.username)
            or query in utils.clean_query(user.name)
            or query in utils.clean_query(user.max_size_fill)
            or query in utils.clean_query(user.register_date_str)
            or query in utils.clean_query(user.last_date_str)
            or query in utils.clean_query(user.admin_str)
            or query in utils.clean_query(user.reacter_str)
            or query in utils.clean_query(user.mark)
            or query in utils.clean_query(user.rpm)
            or query in utils.clean_query(user.reader_str)
            or query in utils.clean_query(user.num_posts)
            or query in utils.clean_query(user.num_reactions)
        )

        if not ok:
            continue

        users.append(user)

    total_str = f"{len(users)}"
    sort_users(users, sort)

    if psize > 0:
        start_index = (page - 1) * psize
        end_index = start_index + psize
        has_next_page = end_index < len(users)
        users = users[start_index:end_index]
    else:
        has_next_page = False

    return users, total_str, has_next_page


def sort_users(users: list[User], sort: str) -> None:
    if sort == "register_date":
        users.sort(key=lambda x: x.register_date, reverse=True)
    elif sort == "register_date_desc":
        users.sort(key=lambda x: x.register_date, reverse=False)

    elif sort == "last_date":
        users.sort(key=lambda x: x.last_date, reverse=True)
    elif sort == "last_date_desc":
        users.sort(key=lambda x: x.last_date, reverse=False)

    elif sort == "username":
        users.sort(key=lambda x: x.username, reverse=True)
    elif sort == "username_desc":
        users.sort(key=lambda x: x.username, reverse=False)

    elif sort == "name":
        users.sort(key=lambda x: x.name, reverse=True)
    elif sort == "name_desc":
        users.sort(key=lambda x: x.name, reverse=False)

    elif sort == "rpm":
        users.sort(key=lambda x: x.rpm, reverse=True)
    elif sort == "rpm_desc":
        users.sort(key=lambda x: x.rpm, reverse=False)

    elif sort == "max_size":
        users.sort(key=lambda x: x.max_size, reverse=True)
    elif sort == "max_size_desc":
        users.sort(key=lambda x: x.max_size, reverse=False)

    elif sort == "admin":
        users.sort(key=lambda x: x.admin, reverse=True)
    elif sort == "admin_desc":
        users.sort(key=lambda x: x.admin, reverse=False)

    elif sort == "reader":
        users.sort(key=lambda x: x.reader, reverse=True)
    elif sort == "reader_desc":
        users.sort(key=lambda x: x.reader, reverse=False)

    elif sort == "lister":
        users.sort(key=lambda x: x.lister, reverse=True)
    elif sort == "lister_desc":
        users.sort(key=lambda x: x.lister, reverse=False)

    elif sort == "poster":
        users.sort(key=lambda x: x.poster, reverse=True)
    elif sort == "poster_desc":
        users.sort(key=lambda x: x.poster, reverse=False)

    elif sort == "reacter":
        users.sort(key=lambda x: x.reacter, reverse=True)
    elif sort == "reacter_desc":
        users.sort(key=lambda x: x.reacter, reverse=False)

    elif sort == "num_posts":
        users.sort(key=lambda x: x.num_posts, reverse=True)
    elif sort == "num_posts_desc":
        users.sort(key=lambda x: x.num_posts, reverse=False)

    elif sort == "num_reactions":
        users.sort(key=lambda x: x.num_reactions, reverse=True)
    elif sort == "num_reactions_desc":
        users.sort(key=lambda x: x.num_reactions, reverse=False)

    elif sort == "mark":
        users.sort(key=lambda x: x.mark, reverse=True)
    elif sort == "mark_desc":
        users.sort(key=lambda x: x.mark, reverse=False)


def get_user(username: str) -> User | None:
    user = database.get_user(username)

    if not user:
        return None

    if user.username == username:
        return make_user(user)

    return None


def check_value(user: User | None, what: str, value: Any) -> tuple[bool, Any]:
    vtype = user_types.get(what, None)

    if not vtype:
        return False, None

    if what == "username":
        value = value.strip()

        if not value:
            return False, None

        if not value.isalnum():
            return False, None

        if len(value) > config.max_user_username_length:
            return False, None
    elif what == "password":
        if value:
            if len(value) > config.max_user_password_length:
                return False, None
            value = hashpass(value)
        elif user and user.password:
            value = user.password
        else:
            return False, None
    elif what == "name":
        value = value.strip()

        if not value:
            if user and user.name:
                value = user.name

        if value:
            value = utils.single_line(value)

            if len(value) > config.max_user_name_length:
                return False, None
    elif what == "mark":
        value = value.strip()

        if not value:
            if user and user.mark:
                value = user.mark

        if value:
            if not value.isalnum():
                return False, None
    elif value:
        if vtype == "int":
            try:
                value = min(9_000_000, max(0, int(value)))
            except ValueError:
                value = 0
        elif vtype == "string":
            value = "".join(
                [
                    c
                    for c in value
                    if c.isalnum() or c in [" ", "_", ".", ",", "-", "!", "?"]
                ]
            )

            value = utils.single_line(value)
            value = str(value)[:200]
        elif vtype == "bool":
            value = bool(value)

    return True, value


def edit_user(
    mode: str, request: Request, username: str, admin: User
) -> tuple[bool, str]:
    if not request:
        return False, "No Request"

    args = {}

    if mode == "add":
        args["username"] = request.form.get("username").lower()
    elif mode == "edit":
        args["username"] = username

    args["password"] = request.form.get("password")
    args["name"] = request.form.get("name")
    args["rpm"] = request.form.get("rpm")
    args["max_size"] = request.form.get("max_size")
    args["mark"] = request.form.get("mark")

    if request.form.get("reader") is None:
        args["reader"] = False
    else:
        args["reader"] = True

    if request.form.get("admin") is None:
        args["admin"] = False
    else:
        args["admin"] = True

    if request.form.get("lister") is None:
        args["lister"] = False
    else:
        args["lister"] = True

    if request.form.get("poster") is None:
        args["poster"] = False
    else:
        args["poster"] = True

    if request.form.get("reacter") is None:
        args["reacter"] = False
    else:
        args["reacter"] = True

    if request.form.get("rpm") is None:
        args["rpm"] = 0

    if request.form.get("max_size") is None:
        args["max_size"] = 0

    n_args = {}
    user = None

    if mode == "edit":
        user = get_user(username)

        if not user:
            return False, "User not found"

    for key in args:
        if mode == "edit":
            if key in ["username"]:
                continue

        ok, value = check_value(user, key, args[key])

        if not ok:
            return False, f"Invalid Value '{key}'"

        n_args[key] = value

    uname = username or n_args["username"]

    if not uname:
        return False, "Missing Username"

    if mode == "add":
        user = get_user(uname)

        if user:
            return False, "Already Exists"

    if uname == admin.username:
        args["admin"] = True

    required = ["password"]

    if not all(n_args.get(key) for key in required):
        return False, "Missing Required"

    database.add_user(
        mode,
        uname,
        n_args["password"],
        n_args["admin"],
        n_args["name"],
        n_args["rpm"],
        n_args["max_size"],
        n_args["reader"],
        n_args["mark"],
        n_args["lister"],
        n_args["poster"],
        n_args["reacter"],
    )

    check_user_changes(user, n_args)
    return True, uname


def check_auth(username: str, password: str) -> User | None:
    user = get_user(username)

    if not user:
        return None

    if user.username == username:
        if checkpass(user.password, password):
            return user

    return None


def delete_users(usernames: list[str], admin: str) -> tuple[str, int]:
    if not usernames:
        return utils.bad("Usernames were not provided")

    if admin in usernames:
        return utils.bad("You can't delete yourself")

    for username in usernames:
        do_delete_user(username)

    return utils.ok("User deleted successfully")


def delete_user(username: str, admin: str) -> tuple[str, int]:
    if not username:
        return utils.bad("Usename was not provided")

    if username == admin:
        return utils.bad("You can't delete yourself")

    do_delete_user(username)
    return utils.ok("User deleted successfully")


def do_delete_user(username: str) -> None:
    if not username:
        return

    database.delete_user(username)


def delete_normal_users() -> tuple[str, int]:
    database.delete_normal_users()
    return utils.ok("Normal users deleted")


def check_user_limit(user: User) -> tuple[bool, str]:
    if user.username not in user_data:
        rpm = user.rpm or config.requests_per_minute
        user_data[user.username] = UserData(rpm)

    if user_data[user.username].blocked():
        return False, "Rate limit exceeded"

    return True, "ok"


def check_user_max(user: User, size: int) -> bool:
    megas = int(size / 1000 / 1000)

    if user.max_size > 0:
        return megas <= user.max_size

    return megas <= config.max_size_user


def mod_user(
    usernames: list[str], what: str, value: str, vtype: str, user: User
) -> tuple[str, int]:
    if not what:
        return utils.bad("No field provided")

    new_value: Any = None

    if vtype == "int":
        try:
            new_value = max(0, int(value))
        except ValueError:
            new_value = 0
    elif vtype == "string":
        new_value = str(value)
    elif vtype == "bool":
        new_value = bool(value)
    elif vtype == "number":
        new_value = int(value)

    if new_value is None:
        return utils.bad("Invalid value")

    if user.admin and (what == "admin"):
        usernames.remove(user.username)

    ok, value = check_value(None, what, value)

    if not ok:
        return utils.bad("Invalid value")

    database.mod_user(usernames, what, new_value)
    check_user_changes(user, {"name": value})
    return utils.ok()


def login(request: Request) -> tuple[bool, str, User | None]:
    if not request:
        return False, "No Request", None

    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")

    if (not username) or (not password):
        return False, "Missing details", None

    user = check_auth(username, password)

    if not user:
        return False, "Invalid username or password", None

    return True, "User logged in successfully", user


def register(request: Request) -> tuple[bool, str, User | None]:
    if not request:
        return False, "No Request", None

    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")
    password_2 = request.form.get("password_2", "")
    name = request.form.get("name", "").strip()

    if (not username) or (not password) or (not password_2) or (not name):
        return False, "Missing details", None

    if password != password_2:
        return False, "Passwords do not match", None

    ok, username = check_value(None, "username", username)

    if not ok:
        return False, "Invalid username", None

    ok, password = check_value(None, "password", password)

    if not ok:
        return False, "Invalid password", None

    ok, name = check_value(None, "name", name)

    if not ok:
        return False, "Invalid name", None

    user = get_user(username)

    if user:
        return False, "User already exists", None

    database.add_user("add", username=username, password=password, name=name)
    user = get_user(username)

    if not user:
        return False, "User not found", None

    return True, "User registered successfully", user


def check_user_changes(user: User | None, args: dict[str, Any]) -> None:
    if not user:
        return

    if "lister" in args:
        if user.lister != args["lister"]:
            database.change_listed(user.username, args["lister"])
