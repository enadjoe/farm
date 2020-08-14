<div class="container">
        {#each animalChoices as animalChoice, a}
            <button on:click={() => enterButtonClick(animalChoice)}>
                <img class="animal-image" src={"models/img/"+animalChoice+".png"} alt={animalChoice}>
            </button>
         {/each}
</div>

<style>
    .container {
        height: 100%;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: '#98e1f4';
    }
    .animal-image {
        height: 100px;
        width: 100px;
    }
   
</style>

<script>
    import { onMount } from 'svelte';
    import { animal } from './stores.js';
    export let inRoom;
    let userAnimal;
    function enterButtonClick(animalChoice) {
        $animal = animalChoice;
        inRoom = true;
    }

    const animalChoices = ['pug', 'horse', 'cow', 'zebra', 'llama', 'sheep', 'pig']

    onMount(async () => {
        console.log('mounted animal chooser')
    });
</script>