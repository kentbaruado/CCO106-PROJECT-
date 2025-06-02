import { supabase } from './supabase-config.js'; // Adjust the path if necessary

// Function to fetch candidates
async function fetchCandidates() {
    console.log('Fetching candidates...')
    const searchInput = document.getElementById('search');
    const candidateTable = document.getElementById('candidateTable');
    const tbody = candidateTable.querySelector('tbody');
    const votedCandidateDisplay = document.getElementById('votedCandidateDisplay');
    const electionCandidatesHeading = document.getElementById('electionCandidatesHeading');

    const electionContentDiv = document.getElementById('electionContent');
    const noElectionMessageDiv = document.getElementById('noElectionMessage');

    // No need to initially hide/show here, handled by CSS
    // if (electionContentDiv) electionContentDiv.style.display = 'none';
    // if (noElectionMessageDiv) noElectionMessageDiv.style.display = 'block';

    try {
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .order('votes', { ascending: false })
        
        if (error) {
            console.error('Error fetching candidates:', error)
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="color: red; text-align: center;">
                        Error loading candidates: ${error.message}
                    </td>
                </tr>
            `
            // Ensure content is hidden and error message is shown using classes
            if (electionContentDiv) electionContentDiv.classList.add('hidden');
            if (noElectionMessageDiv) {
                noElectionMessageDiv.textContent = 'Error loading election data.';
                noElectionMessageDiv.classList.remove('hidden');
            }
            return
        }
        
        if (!data || data.length === 0) {
            console.log('No candidates found in database')
            tbody.innerHTML = ''; // Clear the table body
            // Ensure content is hidden and no election message is shown using classes
            if (electionContentDiv) electionContentDiv.classList.add('hidden');
            if (noElectionMessageDiv) {
                noElectionMessageDiv.textContent = 'No active election at the moment.';
                noElectionMessageDiv.classList.remove('hidden');
            }
            return
        }
        
        console.log('Candidates fetched successfully:', data)

        // Show election content and hide no election message using classes
        if (electionContentDiv) electionContentDiv.classList.remove('hidden');
        if (noElectionMessageDiv) noElectionMessageDiv.classList.add('hidden');

        // The following lines were previously hiding/showing elements, but are now unnecessary
        // searchInput.style.display = '';
        // candidateTable.style.display = '';
        // votedCandidateDisplay.textContent = '';
        // votedCandidateDisplay.style.cssText = 'text-align: center; margin-bottom: 20px; font-size: 1.2em; color: #4ade80;';
        // if (electionCandidatesHeading) electionCandidatesHeading.style.display = '';
        
        // Check if user has already voted
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        let votedCandidateId = null;
        if (user && !userError) {
            const { data: voteData, error: voteError } = await supabase
                .from('votes')
                .select('candidate_id')
                .eq('user_id', user.id)
                .single();

            if (voteData && !voteError) {
                votedCandidateId = voteData.candidate_id;
            } else if (voteError && voteError.code !== 'PGRST116') { // PGRST116 means no rows found
                 console.error('Error checking user vote:', voteError);
            }
        }

        updateCandidateTable(data, votedCandidateId);

    } catch (err) {
        console.error('Unexpected error fetching candidates:', err)
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="color: red; text-align: center;">
                    Unexpected error: ${err.message}
                </td>
            </tr>
        `
        // Hide elements if error
        if (electionContentDiv) electionContentDiv.classList.add('hidden');
        if (noElectionMessageDiv) {
            noElectionMessageDiv.textContent = 'An unexpected error occurred.';
            noElectionMessageDiv.classList.remove('hidden');
        }
    }
}

// Function to update the candidate table
function updateCandidateTable(candidates, votedCandidateId) {
    const tbody = document.querySelector('#candidateTable tbody')
    tbody.innerHTML = ''
    
    const hasVoted = votedCandidateId !== null;
    const votedCandidateNameElement = document.getElementById('votedCandidateName');

    // Clear the voted candidate display initially
    if (votedCandidateNameElement) {
        votedCandidateNameElement.textContent = '';
    }

    candidates.forEach(candidate => {
        const row = document.createElement('tr')
        let actionCell = '';
        let rowClass = '';

        if (candidate.id === votedCandidateId) {
            actionCell = '<td>Voted! ✅</td>';
            rowClass = 'voted-row';
            // Display the voted candidate's name if this is the one they voted for
            if (votedCandidateNameElement) {
                 votedCandidateNameElement.textContent = `You voted for: ${candidate.name}`; // Update to show specific candidate
            }
        } else if (hasVoted) { // If user has voted but not for this candidate
            actionCell = '<td>Vote Disabled</td>';
        } else { // If user has not voted yet
            actionCell = `<td><button class="vote-btn" data-id="${candidate.id}">🗳️ Vote</button></td>`;
        }

        row.innerHTML = `
            <td>${candidate.name}</td>
            <td>${candidate.position}</td>
            <td>${candidate.votes || 0}</td>
            ${actionCell}
        `;
        if (rowClass) {
            row.classList.add(rowClass);
        }
        tbody.appendChild(row);
    });

    // Disable all vote buttons if the user has voted
    if (hasVoted) {
        const voteButtons = tbody.querySelectorAll('.vote-btn');
        voteButtons.forEach(button => button.disabled = true);
    }

    // Use event delegation for vote buttons only if the user hasn't voted
    if (!hasVoted) {
         tbody.removeEventListener('click', handleVoteEvent); // Remove previous listener if any
         tbody.addEventListener('click', handleVoteEvent);
    }
}

// Event handler for vote button click (delegated)
async function handleVoteEvent(event) {
    if (event.target.classList.contains('vote-btn')) {
        await handleVote(event);
        // After successful vote, re-fetch candidates to update the UI
        fetchCandidates();
    }
}

// Function to handle voting
async function handleVote(event) {
    const candidateId = event.target.dataset.id;
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        alert('Please log in to vote');
        return;
    }
    
    // Check if user has already voted (redundant check, but good for safety)
    const { data: voteData, error: voteError } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user.id)
        .single();
    
    if (voteError && voteError.code !== 'PGRST116') {
        console.error('Error checking vote before recording:', voteError);
        return;
    }
    
    if (voteData) {
        alert('You have already voted');
        return;
    }
    
    // Record the vote
    const { error: recordError } = await supabase
        .from('votes')
        .insert([{ user_id: user.id, candidate_id: candidateId }]);
    
    if (recordError) {
        console.error('Error recording vote:', recordError);
        alert('Error recording vote: ' + recordError.message);
        return;
    }
    
    console.log('Vote recorded successfully for candidate:', candidateId);

    // Update candidate votes using RPC
    console.log('Attempting to increment votes for candidate:', candidateId);
    const { data: incrementData, error: updateError } = await supabase.rpc('increment_votes', {
        candidate_id: candidateId
    });

    if (updateError) {
        console.error('Error updating votes via RPC:', updateError);
        alert('Error updating votes: ' + updateError.message);
        return;
    }

    console.log('RPC increment_votes successful. Response data:', incrementData);

    // No need to manually fetch or update here, realtime will handle it if subscribed
    // However, we need to update the UI to show that the user has voted immediately.
    // This will be handled by re-fetching candidates after a successful vote.
}

// Set up real-time subscription
function setupRealtimeSubscription() {
    const subscription = supabase
        .channel('candidates_changes')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'candidates' 
            }, 
            payload => {
                console.log('Change received!', payload)
                fetchCandidates() // Re-fetch candidates on any change
            }
        )
        .subscribe()
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    fetchCandidates();
    setupRealtimeSubscription();
    // Initial check and display of voted candidate on page load
    // This is now handled within fetchCandidates
}); 