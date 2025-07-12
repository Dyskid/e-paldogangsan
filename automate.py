"""
Mall Scraper Mapping Automation Script
Executes scraper mapping commands for mallid 1 to 93 every 5 minutes.
Uses --dangerously-skip-permissions flag.
"""

import subprocess
import time
import signal
import sys
import os
import json
from datetime import datetime, timedelta

# ===== Configuration =====
# Mall ID range
START_ID = 1
END_ID = 93

# Execution interval (seconds, 5 minutes = 300 seconds)
INTERVAL = 300

# Action after completion ("loop": restart from 1, "stop": terminate)
AFTER_COMPLETION = "stop"

# Log file
LOG_FILE = "mall_scraper_mapping_log.txt"

# State file (for resuming after interruption)
STATE_FILE = "mall_scraper_mapping_state.json"

# Global variables
running = True
current_id = START_ID

# ===== Function Definitions =====

def signal_handler(sig, frame):
    """Handle Ctrl+C"""
    global running
    print("\n\n🛑 Stopping script...")
    print(f"📍 Last executed Mall ID: {current_id}")
    print(f"💾 Will resume from Mall ID={current_id} on restart.")
    running = False
    sys.exit(0)

def save_state(id_value):
    """Save current state"""
    state = {
        "current_id": id_value,
        "last_update": datetime.now().isoformat(),
        "total_processed": id_value - START_ID
    }
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)

def load_state():
    """Load saved state"""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                state = json.load(f)
                return state.get("current_id", START_ID)
        except:
            return START_ID
    return START_ID

def log_message(message, to_file=True):
    """Output message to console and file"""
    print(message)
    if to_file and LOG_FILE:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"{message}\n")

def execute_command(id_value):
    """Execute Mall scraper mapping command"""
    # Generate command
    prompt = f"Map appropriate scraper to mall with mallid {id_value}. If none exists, review existing scrapers and if none are suitable, create a new one and map it. Refer to /projects/docs/intelligent-scraper-plan"
    command = ["claude", "--dangerously-skip-permissions", prompt]
    
    log_message(f"🔧 Executing: Mall ID={id_value} scraper mapping")
    log_message(f"📝 Command: {' '.join(command)}")
    
    try:
        # Execute process
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            universal_newlines=True
        )
        
        # Read output in real-time
        for line in process.stdout:
            log_message(line.rstrip())
        
        # Wait for process to complete
        process.wait()
        
        if process.returncode == 0:
            log_message(f"✅ Mall ID={id_value} completed")
        else:
            log_message(f"❌ Command execution failed (exit code: {process.returncode})")
            
    except Exception as e:
        log_message(f"❌ Error occurred: {str(e)}")

def format_duration(seconds):
    """Convert seconds to readable format"""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    parts = []
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    if secs > 0 or not parts:
        parts.append(f"{secs}s")
    
    return " ".join(parts)

def get_progress_bar(current, total, width=40):
    """Generate progress bar"""
    percentage = (current - 1) / total  # Starting from 1, so -1
    filled = int(width * percentage)
    bar = "█" * filled + "░" * (width - filled)
    return f"[{bar}] {current-1}/{total} ({percentage*100:.1f}%)"

def print_summary():
    """Print current status summary"""
    total_malls = END_ID - START_ID + 1
    processed = current_id - START_ID
    remaining = END_ID - current_id + 1
    
    log_message("\n📊 Current Status Summary")
    log_message(f"   Total Malls: {total_malls}")
    log_message(f"   Processed: {processed}")
    log_message(f"   Remaining: {remaining}")
    
    if remaining > 0:
        eta_seconds = remaining * INTERVAL
        eta = datetime.now() + timedelta(seconds=eta_seconds)
        log_message(f"   Estimated completion: {eta.strftime('%Y-%m-%d %H:%M:%S')} ({format_duration(eta_seconds)})")

def main():
    global current_id, running
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Load previous state
    current_id = load_state()
    
    # Start message
    log_message("=" * 70)
    log_message("🚀 Mall Scraper Mapping Automation Started")
    log_message("=" * 70)
    log_message(f"📋 Task: Map appropriate scraper to mall with mallid [ID]")
    log_message(f"📁 Reference document: /projects/docs/intelligent-scraper-plan")
    log_message(f"🔢 Mall ID range: {START_ID} ~ {END_ID}")
    log_message(f"⏱️  Execution interval: {INTERVAL} seconds ({format_duration(INTERVAL)})")
    log_message(f"🔄 After completion: {AFTER_COMPLETION}")
    log_message(f"📝 Log file: {LOG_FILE}")
    log_message(f"⚠️  Flag: --dangerously-skip-permissions")
    log_message("=" * 70)
    
    if current_id != START_ID:
        log_message(f"⚡ Previous execution detected. Starting from Mall ID={current_id}.")
        log_message(f"💡 To start from beginning, delete {STATE_FILE} file.")
        log_message("=" * 70)
    
    # Print total estimated time
    print_summary()
    log_message("=" * 70)
    
    # Main loop
    while running:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Show progress
        progress = get_progress_bar(current_id, END_ID)
        
        log_message(f"\n⏰ [{current_time}] Mall Scraper Mapping Task")
        log_message(f"🏢 Mall ID: {current_id}")
        log_message(f"📊 Progress: {progress}")
        log_message("-" * 70)
        
        # Execute command
        start_time = time.time()
        execute_command(current_id)
        execution_time = time.time() - start_time
        
        log_message(f"⏱️  Execution time: {format_duration(int(execution_time))}")
        
        # Save state
        save_state(current_id)
        
        log_message("=" * 70)
        
        # Calculate next ID
        if current_id >= END_ID:
            log_message(f"🎉 All Malls processed ({START_ID} ~ {END_ID})")
            
            if AFTER_COMPLETION == "loop":
                log_message("🔄 Restarting from beginning.")
                current_id = START_ID
                save_state(current_id)
            else:
                log_message("🏁 Terminating script.")
                if os.path.exists(STATE_FILE):
                    os.remove(STATE_FILE)  # Delete state file
                break
        else:
            current_id += 1
        
        if running:
            # Calculate next execution time
            next_time = datetime.now() + timedelta(seconds=INTERVAL)
            log_message(f"⏭️  Next task: Mall ID={current_id}")
            log_message(f"🕐 Scheduled time: {next_time.strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Current status summary
            print_summary()
            
            log_message(f"\n💤 Waiting {INTERVAL} seconds ({format_duration(INTERVAL)})... (Ctrl+C to stop)")
            log_message("=" * 70)
            
            # Check every 1 second for immediate termination
            for i in range(INTERVAL):
                if not running:
                    break
                time.sleep(1)
    
    log_message("\n�� Mall Scraper Mapping Automation Terminated")

if __name__ == "__main__":
    main()
