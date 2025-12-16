<div align="center">
<img src="/images/icon.png" width="150" height="150" />
<h1>X (Twitter) Mass Unfollow</h1>
<p>A simple (configurable) way to mass unfollow your X (Twitter) followings</p>

</div>

<img src="/images/extension.png" alt="X (Twitter) Mass Unfollow extension UI" width="65%">

Reclaim your X (Twitter) feed — Mass unfollow users with a click of a button.

## Features
- **Smart Auto-Resume**: Automatically resumes the unfollow process after page reload to bypass rate limits.
- **Visual Logger**: Real-time console overlay showing current status, unfollowed users, and statistics.
- **Bulk unfollow options**: Unfollow all accounts or selectively unfollow those who don't follow you back.
- **Demo mode**: Preview the unfollow process without making any changes to your account.
- **Whitelist functionality**: Protect specific accounts from being unfollowed by adding them to a whitelist.
- **Session control**: Configurable option to stop the unfollow process after `n` minutes.

## Usage

- **Download and Install**:
  1. Go to the [Releases](https://github.com/FRAOTIAC/twitter-mass-unfollow/releases) page.
  2. Download the latest `chrome-extension.zip` file and unzip it.
  3. Open Chrome and navigate to `chrome://extensions/`.
  4. Enable **Developer mode** (top right corner).
  5. Click **Load unpacked** and select the unzipped folder.
  - TIP: Pin the extension for easy access
- Visit your [X/Twitter following page](https://x.com/following)
- Click the **DEMO** button to see the extension in action without unfollowing anyone or
- Click **ALL** to unfollow all followings or **NOT FOLLOWING** to unfollow accounts you follow that are not following you
- Use **STOP** to abort the whole process

```
Once started, a black console window will appear at the bottom right.
The extension will automatically pause, reload the page, and resume to avoid Twitter rate limits.
You can leave the tab open and let it run in the background.
```

## Options

The extension can be configured from the options page.

<img src="/images/extension-option.png" alt="extension option page" width="75%" />

#### Exclude users

Keep a whitelist of users (Twitter handles/usernames) to not be unfollowed. This could be people that you both are following each other or not. Twitter handles added here will always be given priority regardless of the action button clicked.

#### Stop after 1 minute

The extension will pause running (unfollowing users) after 1 minute from time started. **It will then automatically reload the page and RESUME the process.** This is highly recommended to avoid account restrictions.

#### Reload on finished

Whether the extension should reload the current page after the running process is stopped. By default, page will be refreshed.

## NOTE

By default, the unfollow process runs for 1 minute (which can be turned off in the extension options page) and there's a delay between each unfollowing action. This is a safety measure to not violate [Twitter Rule](https://help.twitter.com/en/using-twitter/twitter-follow-limit) which could lead to having your account restricted by Twitter.
