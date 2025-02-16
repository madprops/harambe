from __future__ import annotations

# Standard
import copy
import tomllib
import string
import time
import threading
from pathlib import Path
from dataclasses import dataclass
from typing import Any

# Libraries
from watchdog.observers import Observer  # type: ignore
from watchdog.events import FileSystemEventHandler  # type: ignore

# Modules
import utils


class FileChangeHandler(FileSystemEventHandler):  # type: ignore
    def __init__(self, config: Config) -> None:
        self.path = config.path

    def on_modified(self, event: Any) -> None:
        if Path(event.src_path) == self.path:
            config.read()


@dataclass
class User:
    username: str
    password: str
    name: str
    admin: bool
    limit: int
    max: int
    list: bool
    mark: str


@dataclass
class Link:
    name: str
    url: str
    target: str = "_self"


class Config:
    def __init__(self, main: bool = True) -> None:
        self.reference: Config | None

        if main:
            self.reference = Config(False)
        else:
            self.reference = None

        self.path: Path = Path("config.toml")

        # Users who can make posts
        # Dict object: name, limit, id (optional)
        self.users: list[User] = []

        # List of links to show in the index page
        # Dict object: name, url, target (optional)
        self.links: list[Link] = [
            Link("About", "/static/demo/about.html", "_blank"),
        ]

        # Secret key for security
        # Make it a long random string
        self.app_key: str = "fixthis"

        # The location to save the files
        # It can be outside the project folder
        self.files_dir: str = "files"

        # Require to solve a captcha to upload in the web interface
        self.require_captcha: bool = True

        # Secret key for security
        # Make it a long random string
        self.captcha_key: str = ""

        # Use this to cheat the captcha
        # Should be kept semi-secret
        self.captcha_cheat: str = ""

        # Length of the captcha
        # The higher the number, the harder it is
        self.captcha_length: int = 10

        # Maximum file size in MB
        # Files beyond this will get ignored
        self.max_size: int = 100

        # Default max size for users
        self.max_size_user: int = 100

        # Max size for anonymous users
        self.max_size_anon: int = 20

        # Port for the redis server
        # Redis is used for the limiter
        self.redis_port: int = 6379

        # Uppercase the post names
        # This is used to name the files
        self.uppercase_names: bool = False

        # Maximum number of posts to keep stored
        # After this the older posts will be deleted
        # The files are also deleted
        self.max_posts: int = 10_000

        # Maximum storage in GB
        # After this the older posts will be deleted
        self.max_storage: int = 10

        # Show the image in the web interface
        self.show_image: bool = True

        # Default page size for the admin page
        self.admin_page_size: int = 50

        # Length of the post name
        # Minimum is 10, maximum is 26
        self.post_name_length: int = 10

        # Requests per minute limit for most endpoints
        self.rate_limit: int = 20

        # Background color for the web interface
        self.background_color: str = "81, 81, 81"

        # Accent color for the web interface
        self.accent_color: str = "127, 104, 164"

        # Font color for the web interface
        self.font_color: str = "255, 255, 255"

        # Text color for the web interface
        self.text_color: str = "255, 255, 255"

        # Link color for the web interface
        self.link_color: str = "222, 211, 239"

        # Font family for the web interface
        self.font_family: str = "sans-serif"

        # Maximum age for the files cache on the user's side
        # Keep this is a huge number to avoid reloading
        # Or a low number to force file reload more often
        self.max_age: int = 31536000

        # Show the max file size in the web interface
        self.show_max_size: bool = True

        # Enable a public page to list posts
        self.list_enabled: bool = True

        # List is private and requires being logged in
        self.list_private: bool = True

        # Default page size for the list page
        self.list_page_size: int = 50

        # Maximum posts allowed to be shown in the list page
        # If 0 it will allow showing all posts
        self.list_max_posts: int = 100

        # Allow admins to delete posts using the admin page or endpoints
        self.allow_delete: bool = True

        # The title of the main index page
        self.main_title: str = "Harambe"

        # Tooltip message to show on the main image
        self.image_tooltip: str = ""

        # The first part of image urls
        # For example 'file' in site.com/file/abc123.jpg
        self.file_path: str = "file"

        # Maximum length allowed for titles
        self.max_title_length: int = 2000

        # Allow titles on post uploads
        self.allow_titles: bool = True

        # Enable uploads through the web interface
        self.web_uploads_enabled: bool = True

        # Enable uploads through the API
        self.api_uploads_enabled: bool = True

        # Allow uploads from non-users
        self.anon_uploads_enabled: bool = False

        # Max size in megabytes to consider files for media embeds
        self.embed_max_size: int = 100

        # Users can edit their own posts
        self.allow_edit: bool = True

        # Users can see their own post history
        self.history_enabled: bool = True

        # Allow or block media hotlinking
        self.allow_hotlinks: bool = True

        # Max content to read when text files are uploaded
        self.sample_size: int = 100_000

        # Default requests per minute for uploads
        self.requests_per_minute = 12

        # Allow non-users to view posts and files
        self.public_posts: bool = True

        # Don't increment view if last view is within this delay in seconds
        self.view_delay: int = 1

        # Content of the description meta tag in the index
        self.description_index: str = "Ask Harambe for your file to be uploaded"

        # Content of the description meta tag in posts
        self.description_post: str = "File kindly uploaded by Harambe"

        # Whether anon uploads should be added to the list or not
        self.anon_listers = True

        # Allow reactions in posts
        self.reactions_enabled = True

        # Allow anons to react in posts
        self.anon_reacters = False

        # Max length for reactions to be stored
        self.max_reactions_length = 100_000

    # --- Methods ---

    def get_max_storage(self) -> int:
        return self.max_storage * 1_000_000_000

    def get_post_name_length(self) -> int:
        return max(min(self.post_name_length, 26), 10)

    def get_captcha(self) -> dict[str, Any]:
        return {
            "SECRET_CAPTCHA_KEY": self.captcha_key or "nothing",
            "CAPTCHA_LENGTH": self.captcha_length,
            "CAPTCHA_DIGITS": False,
            "EXPIRE_SECONDS": 60,
            "CAPTCHA_IMG_FORMAT": "JPEG",
            "ONLY_UPPERCASE": False,
            "CHARACTER_POOL": string.ascii_lowercase,
        }

    def get_user(self, username: str) -> User | None:
        for user in self.users:
            if user.username == username:
                return user

        return None

    def read(self) -> None:
        def defvalue(name: str) -> Any:
            return copy.deepcopy(getattr(self.reference, name))

        def set_value(c: dict[str, Any], name: str) -> None:
            setattr(self, name, c.get(name, defvalue(name)))

        with self.path.open("rb") as f:
            try:
                c = tomllib.load(f)
            except Exception as e:
                utils.error(e)
                return

            set_value(c, "app_key")
            set_value(c, "files_dir")
            set_value(c, "require_captcha")
            set_value(c, "captcha_key")
            set_value(c, "captcha_cheat")
            set_value(c, "captcha_length")
            set_value(c, "max_size")
            set_value(c, "max_size_user")
            set_value(c, "max_size_anon")
            set_value(c, "redis_port")
            set_value(c, "uppercase_names")
            set_value(c, "max_posts")
            set_value(c, "max_storage")
            set_value(c, "show_image")
            set_value(c, "admin_page_size")
            set_value(c, "post_name_length")
            set_value(c, "rate_limit")
            set_value(c, "background_color")
            set_value(c, "accent_color")
            set_value(c, "font_color")
            set_value(c, "text_color")
            set_value(c, "link_color")
            set_value(c, "font_family")
            set_value(c, "max_age")
            set_value(c, "show_max_size")
            set_value(c, "list_enabled")
            set_value(c, "list_private")
            set_value(c, "list_page_size")
            set_value(c, "list_max_posts")
            set_value(c, "allow_delete")
            set_value(c, "main_title")
            set_value(c, "image_tooltip")
            set_value(c, "file_path")
            set_value(c, "allow_titles")
            set_value(c, "web_uploads_enabled")
            set_value(c, "api_uploads_enabled")
            set_value(c, "anon_uploads_enabled")
            set_value(c, "embed_max_size")
            set_value(c, "allow_edit")
            set_value(c, "history_enabled")
            set_value(c, "max_title_length")
            set_value(c, "allow_hotlinks")
            set_value(c, "sample_size")
            set_value(c, "requests_per_minute")
            set_value(c, "public_posts")
            set_value(c, "view_delay")
            set_value(c, "description_index")
            set_value(c, "description_post")
            set_value(c, "anon_listers")
            set_value(c, "reactions_enabled")
            set_value(c, "anon_reacters")
            set_value(c, "max_reactions_length")

            # Users

            users: list[dict[str, Any]] = c.get("users", [])

            if users:
                self.users = [
                    User(
                        user.get("username", ""),
                        user.get("password", ""),
                        user.get("name", ""),
                        user.get("admin", False),
                        user.get("limit", 12),
                        user.get("max", 0),
                        user.get("list", False),
                        user.get("mark", ""),
                    )
                    for user in users
                ]

            # Links

            links: list[dict[str, str]] = c.get("links", [])

            if links:
                self.links = [
                    Link(link["name"], link["url"], link.get("target", "_self"))
                    for link in links
                ]


# Fill it later
config = Config()


def start_observer() -> None:
    event_handler = FileChangeHandler(config)
    observer = Observer()
    observer.schedule(event_handler, path=str(config.path.parent), recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


# Fill the config object
config.read()

# Start the observer to check for config file changes
# This makes it possible to change things without restarting the server
observer_thread = threading.Thread(target=start_observer, daemon=True)
observer_thread.start()
