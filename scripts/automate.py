"""
Mall Scraper Mapping Automation Script - No Wait Version
Executes scraper mapping commands for mallid 1 to 93 continuously without delay.
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

# Action after completion ("loop": restart from 1, "stop": terminate)
AFTER_COMPLETION = "stop"

# Log file
LOG_FILE = "mall_scraper_mapping_log.txt"

# State file (for resuming after interruption)
STATE_FILE = "mall_scraper_mapping_state.json"

# Maximum execution time per command (seconds)
MAX_EXECUTION_TIME = 600  # 10 minutes timeout

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
    print(message, flush=True)  # flush=True for immediate output
    if to_file and LOG_FILE:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"{message}\n")

def execute_command(id_value):
    """Execute Mall scraper mapping command with timeout"""
    # Generate command
    prompt = """Map the appropriate scraper to the mall with mall ID: {id_value}

Work Process:

1. Verify existing mappings:
   - Check if a scraper is already mapped to this mall in scripts/data/scraper-registry.json
   - Verify that the mapped scraper actually exists in scripts/scrapers directory
   - If the scraper doesn't exist, remove it from scripts/data/scraper-registry.json

2. Handle unmapped malls:
   - If no mapping exists in scripts/data/scraper-mappings.json:
     - Review existing scrapers in scripts/scrapers directory for suitability
     - If a suitable scraper exists, create the mapping
     - If no suitable scraper exists, create a new one

3. When creating a new scraper:
   - Create the scraper in scripts/scrapers directory
   - Register it in scripts/data/scraper-registry.json
   - Add the mapping to scripts/data/scraper-mappings.json

Important notes:
- Refer to /projects/docs/intelligent-scraper-plan for design specifications
- Store temporary files (e.g., test files) in the temporary directory
- All scrapers registered in scripts/data/scraper-registry.json must exist in scripts/scrapers
- The final output should update scripts/data/scraper-mappings.json"""
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
        
        # Read output in real-time with timeout
        start_time = time.time()
        for line in process.stdout:
            log_message(line.rstrip())
            
            # Check timeout
            if time.time() - start_time > MAX_EXECUTION_TIME:
                log_message(f"⚠️ Timeout reached ({MAX_EXECUTION_TIME}s). Terminating process...")
                process.terminate()
                time.sleep(5)
                if process.poll() is None:
                    process.kill()
                break
        
        # Wait for process to complete
        return_code = process.wait()
        
        if return_code == 0:
            log_message(f"✅ Mall ID={id_value} completed successfully")
        elif return_code == -15:  # SIGTERM
            log_message(f"⚠️ Mall ID={id_value} terminated due to timeout")
        else:
            log_message(f"❌ Command execution failed (exit code: {return_code})")
            
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

def get_progress_bar(current, start, end, width=40):
    """Generate progress bar"""
    total_items = end - start + 1
    completed = current - start
    percentage = completed / total_items if total_items > 0 else 0
    
    filled = int(width * percentage)
    bar = "█" * filled + "░" * (width - filled)
    return f"[{bar}] {completed}/{total_items} ({percentage*100:.1f}%)"

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
        # Estimate based on average execution time (rough estimate)
        avg_time_per_mall = 120  # Assume 2 minutes average per mall
        eta_seconds = remaining * avg_time_per_mall
        eta = datetime.now() + timedelta(seconds=eta_seconds)
        log_message(f"   Estimated completion: {eta.strftime('%Y-%m-%d %H:%M:%S')} (assuming ~2min per mall)")

def main():
    global current_id, running
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Load previous state
    current_id = load_state()
    
    # Start message
    log_message("=" * 70)
    log_message("🚀 Mall Scraper Mapping Automation Started (No Wait Version)")
    log_message("=" * 70)
    log_message(f"📋 Task: Map appropriate scraper to mall with mallid [ID]")
    log_message(f"📁 Reference document: /projects/docs/intelligent-scraper-plan")
    log_message(f"🔢 Mall ID range: {START_ID} ~ {END_ID}")
    log_message(f"⚡ Execution mode: CONTINUOUS (no delay between tasks)")
    log_message(f"⏱️  Max time per task: {MAX_EXECUTION_TIME} seconds ({format_duration(MAX_EXECUTION_TIME)})")
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
    
    # Track overall start time
    overall_start_time = time.time()
    
    # Main loop
    while running:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Show progress
        progress = get_progress_bar(current_id, START_ID, END_ID)
        
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
            
            # Show total execution time
            total_time = time.time() - overall_start_time
            log_message(f"⏱️  Total execution time: {format_duration(int(total_time))}")
            
            if AFTER_COMPLETION == "loop":
                log_message("🔄 Restarting from beginning.")
                current_id = START_ID
                save_state(current_id)
                overall_start_time = time.time()  # Reset timer
            else:
                log_message("🏁 Terminating script.")
                if os.path.exists(STATE_FILE):
                    os.remove(STATE_FILE)  # Delete state file
                break
        else:
            current_id += 1
        
        if running:
            log_message(f"⏭️  Next task: Mall ID={current_id}")
            
            # Brief pause to allow for Ctrl+C
            time.sleep(0.5)
    
    log_message("\n✅ Mall Scraper Mapping Automation Terminated")

if __name__ == "__main__":
    main()