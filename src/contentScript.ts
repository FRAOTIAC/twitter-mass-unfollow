import { MessageType, type RunOptions } from './types';
import { $, storage, waitForElement, waitFor, isExtensionPage } from './utils';

const html = document.querySelector('html')!;
let unFollowedUsers: string[] = [];

let timerHandler: ReturnType<typeof setTimeout> | null = null;
let previousScrollHeight = 0;
let inProgress: boolean = false;
// Global stats to persist across reloads
let totalCount = 0;

// --- UI Components ---

const uiContainer = $.create('div');
uiContainer.id = 'tmu-ui-container';
uiContainer.style.cssText = `
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
  width: 300px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: opacity 0.3s;
  visibility: hidden;
  font-size: 13px;
`;

const header = $.create('div');
header.style.cssText = `
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
`;

const statusText = $.create('span');
statusText.textContent = 'Idle';
statusText.style.fontWeight = 'bold';
statusText.style.color = '#4caf50'; // Green for running

const stopBtn = $.create('button');
stopBtn.textContent = 'Stop';
stopBtn.style.cssText = `
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 12px;
`;
stopBtn.onclick = () => stopTask(true); // Manual stop

header.appendChild(statusText);
header.appendChild(stopBtn);

const logContainer = $.create('div');
logContainer.style.cssText = `
  padding: 10px 15px;
  height: 120px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #ddd;
`;

const statsBar = $.create('div');
statsBar.style.cssText = `
  padding: 8px 15px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255,255,255,0.1);
  font-size: 12px;
  color: #aaa;
`;
statsBar.textContent = 'Total Unfollowed: 0';

uiContainer.appendChild(header);
uiContainer.appendChild(logContainer);
uiContainer.appendChild(statsBar);
document.body.appendChild(uiContainer);

// --- Logger ---

const log = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
  const entry = $.create('div');
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  if (type === 'success') entry.style.color = '#4caf50';
  if (type === 'warning') entry.style.color = '#ff9800';
  
  logContainer.appendChild(entry);
  logContainer.scrollTop = logContainer.scrollHeight;

  // Keep only last 50 logs
  if (logContainer.children.length > 50) {
    logContainer.removeChild(logContainer.children[0]);
  }
};

const updateStatus = (status: string, color: string = '#fff') => {
  statusText.textContent = status;
  statusText.style.color = color;
};

const showUI = () => {
  uiContainer.style.visibility = 'visible';
};

const hideUI = () => {
  uiContainer.style.visibility = 'hidden';
};

// --- Logic ---

const getFollowingsContainer = () => {
  return $.one<HTMLDivElement>('section[role=region] div');
};

const getFollowingButtons = () => {
  return Array.from(
    $.many<HTMLButtonElement>("button[data-testid$='-unfollow']")
  );
};

const getUsername = (followingBtn: HTMLButtonElement) => {
  return (
    followingBtn.getAttribute('aria-label')?.toLowerCase().replace(/.*@/, '') ||
    ''
  );
};

const filterFollowings = async (
  followings: HTMLButtonElement[],
  unFollowNotFollowing: boolean
) => {
  const whitelistedUsers = await storage.get(storage.whiteListedUsersKey);

  const accountsToUnFollow = followings.filter((followingBtn) => {
    if (!whitelistedUsers) return true;
    const username = getUsername(followingBtn);
    return !whitelistedUsers.includes(username);
  });

  return unFollowNotFollowing
    ? accountsToUnFollow.filter((following) => {
        const followsYou =
          !!following.parentElement?.parentElement?.querySelector(
            '[data-testid="userFollowIndicator"]'
          );

        return followsYou ? false : true;
      })
    : accountsToUnFollow;
};

const confirmUnFollow = async () => {
  const confirmUnFollowButton = await waitForElement(
    '[data-testid=confirmationSheetDialog] button[data-testid=confirmationSheetConfirm]'
  );

  if (!confirmUnFollowButton) {
    log('Confirm button not found', 'warning');
    return;
  }

  confirmUnFollowButton.click();
};

const unFollow = async (
  followingButtons: HTMLButtonElement[] = [],
  demo: boolean
) => {
  for (const followingButton of followingButtons) {
    if (!inProgress) break;

    const username = getUsername(followingButton);
    if (!unFollowedUsers.includes(username)) {
      unFollowedUsers.push(username);
      totalCount++;
      statsBar.textContent = `Total Unfollowed: ${totalCount}`;
      await storage.set(storage.taskStatsKey, { totalCount });

      log(`Unfollowing @${username}...`, 'info');

      if (demo) {
        log(`(Demo) Skipped clicking unfolllow for @${username}`, 'warning');
      } else {
        followingButton.click();
        await confirmUnFollow();
        log(`Unfollowed @${username}`, 'success');
      }
      await waitFor(1000 + Math.random() * 1000); // Random delay 1-2s
    }
  }
};

const scrollFollowingList = async (options: RunOptions) => {
  const { shouldUnFollowNotFollowingOnly = false, isDemo = false } =
    options || {};
  
  if (!inProgress) return;

  if (
    previousScrollHeight !== html.scrollHeight &&
    isExtensionPage()
  ) {
    previousScrollHeight = html.scrollHeight;

    const followingsContainer = getFollowingsContainer();
    const followings = getFollowingButtons();
    
    log(`Found ${followings.length} buttons on screen`, 'info');

    const accountsToUnfollow = await filterFollowings(
      followings,
      shouldUnFollowNotFollowingOnly
    );

    log(`Processing ${accountsToUnfollow.length} accounts...`, 'info');

    await unFollow(accountsToUnfollow, isDemo);

    if (!inProgress) return;

    if (followingsContainer) {
      log('Scrolling down...', 'info');
      const scrollBy = followingsContainer.clientHeight;
      html.scroll({
        top: followingsContainer.offsetHeight + scrollBy,
        behavior: 'smooth',
      });
    }

    await waitFor(3000);
    scrollFollowingList(options);
  } else {
    // End of list or no change
    log('No new items loaded. Retrying scroll...', 'warning');
    html.scrollBy(0, 1000);
    await waitFor(3000);
    // TODO: Add max retry logic to avoid infinite loops
    scrollFollowingList(options);
  }
};

const stopTask = async (manual = false) => {
  inProgress = false;
  if (timerHandler) clearInterval(timerHandler);
  
  updateStatus(manual ? 'Stopped' : 'Paused', '#f44336');
  log(manual ? 'Task stopped by user' : 'Task paused');
  
  if (manual) {
    await storage.set(storage.taskStatusKey, 'STOPPED');
  }
};

const reloadPage = async () => {
    log('Refreshing page to avoid rate limits...', 'warning');
    
    let countdown = 5;
    const countInterval = setInterval(() => {
        updateStatus(`Reloading in ${countdown}s...`, '#ff9800');
        countdown--;
        if (countdown < 0) {
            clearInterval(countInterval);
            window.location.reload();
        }
    }, 1000);
};

const startTimer = () => {
  storage.get(storage.timerKey).then((autoStop) => {
    if (autoStop) {
      log('Timer set for 60 seconds', 'info');
      timerHandler = setTimeout(async () => {
        if (!inProgress) return;
        
        // Don't stop fully, just pause and reload
        inProgress = false;
        const shouldReload = await storage.get(storage.reloadOnStoppedKey);
        
        if (shouldReload) {
           // Status remains 'RUNNING' in storage so it auto-starts after reload
           await reloadPage();
        } else {
           // If reload is disabled, we actually stop
           await stopTask(true);
        }
      }, 1000 * 60); 
    }
  });
};

const run = async (options?: RunOptions) => {
  const { shouldUnFollowNotFollowingOnly = false, isDemo = false } =
    options || {};

  if (inProgress) return;

  inProgress = true;
  showUI();
  updateStatus('Running', '#4caf50');
  log('Task started', 'success');

  // Save state
  await storage.set(storage.taskStatusKey, 'RUNNING');
  await storage.set(storage.taskOptionsKey, options);

  scrollFollowingList({
    shouldUnFollowNotFollowingOnly,
    isDemo: isDemo,
  });
  startTimer();
};

// --- Initialization ---

const init = async () => {
    // Restore stats
    const stats = await storage.get(storage.taskStatsKey);
    if (stats && stats.totalCount) {
        totalCount = stats.totalCount;
        statsBar.textContent = `Total Unfollowed: ${totalCount}`;
    }

    // Check if we should auto-start
    const status = await storage.get(storage.taskStatusKey);
    if (status === 'RUNNING') {
        const options = await storage.get(storage.taskOptionsKey);
        log('Resuming task from previous session...', 'info');
        run(options);
    }
};

// Start init
init();

// --- Message Listener ---

chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, reply: (response?: any) => void) => {
  try {
    switch (message.type) {
      case MessageType.UNFOLLOW_ALL:
        run();
        return;
      case MessageType.UNFOLLOW_NOT_FOLLOWING:
        run({ shouldUnFollowNotFollowingOnly: true });
        return;
      case MessageType.DEMO:
        run({ isDemo: true });
        return;
      case MessageType.STOP:
        stopTask(true);
        return;
      case MessageType.CHECK_IN_PROGRESS:
        reply({ payload: inProgress });
        return;
      default:
        break;
    }
  } catch (error) {
    console.log(error);
  }
});

window.addEventListener('beforeunload', () => {
    // If we are reloading programmatically, we don't want to set status to STOPPED
    // But if user closes tab, we might want to? 
    // Actually, keeping it RUNNING is fine, user can manually stop if they reopen.
});

document.body.addEventListener('click', () => {
    // Removed the "click body to stop" feature as it's annoying with the new UI
    // if (!isExtensionPage() && inProgress) abort(); 
});
